import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import ghnService from "../services/ghnService.js";

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { items, amount, address } = req.body;
    const userId = req.user?.id;
    
    // Validate authentication
    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Order items are required" });
    }

    if (!amount) {
      return res.json({ success: false, message: "Order amount is required" });
    }

    if (!address) {
      return res.json({
        success: false,
        message: "Delivery address is required",
      });
    }
    // Validate address required fields with flexible field mapping
    const getAddressValue = (field) => {
      switch (field) {
        case "firstName":
          return (
            address.firstName ||
            address.first_name ||
            address.name?.split(" ")[0] ||
            ""
          );
        case "lastName":
          return (
            address.lastName ||
            address.last_name ||
            address.name?.split(" ").slice(1).join(" ") ||
            ""
          );
        case "zipcode":
          return (
            address.zipcode ||
            address.zipCode ||
            address.zip_code ||
            address.postal_code ||
            ""
          );
        default:
          return address[field] || "";
      }
    };

    const requiredAddressFields = [
      "firstName",
      "lastName",
      "email",
      "street",
      "ward",
      "district",
      "city",
      "zipcode",
      "country",
      "phone",
    ];


    const missingFields = requiredAddressFields.filter((field) => {
      const value = getAddressValue(field);
      return !value || value.toString().trim() === "";
    });

    if (missingFields.length > 0) {
      console.log("Missing fields details:");
      missingFields.forEach((field) => {
        console.log(`${field}: "${getAddressValue(field)}"`);
      });
      return res.json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(", ")}`,
        debug: {
          receivedAddress: address,
          missingFields: missingFields.map((field) => ({
            field,
            value: getAddressValue(field),
          })),
        },
      });
    }

    // Validate items have productId
    const itemsWithoutProductId = items.filter(
      (item) => !item._id && !item.productId
    );
    if (itemsWithoutProductId.length > 0) {
      return res.json({
        success: false,
        message: "All items must have a valid product ID",
      });
    }

    // Verify user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate shipping fee if address has required GHN fields
    let shippingFee = 0;
    if (address.districtId && address.wardCode) {
      const shippingResult = await ghnService.calculateShippingFee({
        toDistrictId: address.districtId,
        toWardCode: address.wardCode,
        weight: items.reduce((total, item) => total + (item.weight || 500) * item.quantity, 0),
      });
      
      if (shippingResult.success) {
        shippingFee = shippingResult.data.total || 0;
      }
    }

    // Create new order with properly mapped fields
    const newOrder = new orderModel({
      userId,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
      })),
      amount,
      shippingFee,
      address: {
        firstName: getAddressValue("firstName"),
        lastName: getAddressValue("lastName"),
        email: address.email || "",
        street: address.street || address.address || "",
        ward: address.ward || address.wardName || "",
        district: address.district || address.districtName || "",
        city: address.city || address.provinceName || "",
        zipcode: getAddressValue("zipcode"),
        country: address.country || "Vietnam",
        phone: address.phone || address.phoneNumber || "",
        provinceId: address.provinceId,
        districtId: address.districtId,
        wardCode: address.wardCode,
      },
      paymentMethod: "cod",
      status: "pending",
      paymentStatus: "pending",
    });

    await newOrder.save();

    // Create GHN order if payment method is not COD and address has GHN data
    if (newOrder.paymentMethod !== "cod" && address.districtId && address.wardCode) {
      try {
        const ghnOrderData = {
          to_name: `${newOrder.address.firstName} ${newOrder.address.lastName}`,
          to_phone: newOrder.address.phone,
          to_address: newOrder.address.street,
          to_ward_code: newOrder.address.wardCode,
          to_district_id: newOrder.address.districtId,
          weight: items.reduce((total, item) => total + (item.weight || 500) * item.quantity, 0),
          length: 20,
          width: 20,
          height: 10,
          service_type_id: 2,
          payment_type_id: 1,
          note: `Đơn hàng #${newOrder._id}`,
          required_note: "KHONGCHOXEMHANG",
          items: items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            weight: item.weight || 500
          }))
        };

        const ghnResult = await ghnService.createOrder(ghnOrderData);
        if (ghnResult.success) {
          newOrder.ghnOrderCode = ghnResult.data.order_code;
          newOrder.ghnExpectedDeliveryTime = new Date(ghnResult.data.expected_delivery_time);
          await newOrder.save();
        }
      } catch (ghnError) {
        console.log("GHN Order Creation Error:", ghnError);
      }
    }

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    res.json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
      orderId: newOrder._id,
      shippingFee,
    });
  } catch (error) {
    console.log("Create Order Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("userId", "name email")
      .populate("items.productId", "name image")
      .sort({ date: -1 });

    res.json({
      success: true,
      orders,
      total: orders.length,
      message: "Orders fetched successfully",
    });
  } catch (error) {
    console.log("Get All Orders Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get orders by user ID
const getUserOrders = async (req, res) => {
  try {
    // Check if it's an admin request with userId param
    const { userId } = req.params;
    const requestUserId = userId || req.user?.id; // Use param for admin, auth user for regular users

    if (!requestUserId) {
      return res.json({
        success: false,
        message: "User ID not provided",
      });
    }

    const orders = await orderModel
      .find({ userId: requestUserId })
      .populate("items.productId", "name image price")
      .sort({ date: -1 });

    res.json({
      success: true,
      orders,
      total: orders.length,
      message: "User orders fetched successfully",
    });
  } catch (error) {
    console.log("Get User Orders Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get single order by user ID and order ID
const getUserOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id; // From auth middleware

    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .populate("items.productId", "name image price");

    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
      message: "Order fetched successfully",
    });
  } catch (error) {
    console.log("Get User Order By ID Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
// Cancel order (user)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id; // From auth middleware

    // Validate authentication
    if (!userId) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!orderId) {
      return res.json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Find the order and verify ownership
    const order = await orderModel.findOne({ _id: orderId, userId });
    
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found or you don't have permission to cancel this order",
      });
    }

    // Check if order can be cancelled (only pending orders)
    if (order.status !== "pending") {
      return res.json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Only pending orders can be cancelled.`,
      });
    }

    // Check if order is already cancelled
    if (order.status === "cancelled") {
      return res.json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // Update order status to cancelled
    order.status = "cancelled";
    order.updatedAt = Date.now();
    
    // If payment was made, mark for refund
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
    } else {
      order.paymentStatus = "failed"; // Mark as failed if payment was pending
    }

    await order.save();

    // Log the cancellation (optional)
    console.log(`Order ${orderId} cancelled by user ${userId} at ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.log("Cancel Order Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Update order status (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, paymentStatus } = req.body;

    if (!orderId || !status) {
      return res.json({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        message: "Invalid status",
      });
    }

    const validPaymentStatuses = ["pending", "paid", "failed"];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return res.json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    order.updatedAt = Date.now();
    await order.save();

    res.json({
      success: true,
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.log("Update Order Status Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Get order statistics (Admin Dashboard)
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await orderModel.countDocuments();
    const pendingOrders = await orderModel.countDocuments({
      status: "pending",
    });
    const deliveredOrders = await orderModel.countDocuments({
      status: "delivered",
    });

    // Calculate total revenue
    const revenueResult = await orderModel.aggregate([
      { $match: { status: { $in: ["delivered", "shipped", "confirmed"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Get recent orders
    const recentOrders = await orderModel
      .find({})
      .populate("userId", "name email")
      .sort({ date: -1 })
      .limit(10);

    // Monthly orders (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await orderModel.aggregate([
      { $match: { date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue,
        recentOrders,
        monthlyOrders,
      },
      message: "Order statistics fetched successfully",
    });
  } catch (error) {
    console.log("Get Order Stats Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

// Delete order (Admin)
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    await orderModel.findByIdAndDelete(orderId);

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.log("Delete Order Error:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createOrder,
  getAllOrders,
  getUserOrders,
  getUserOrderById,
  updateOrderStatus,
  getOrderStats,
  deleteOrder,
  cancelOrder
};
