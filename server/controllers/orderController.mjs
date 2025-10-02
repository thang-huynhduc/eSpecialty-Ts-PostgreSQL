import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import ghnService from "../services/ghnService.js";
import { sendOtpEmail } from "../services/emaiService.js";
import { refundPayPalPayment as refundPayPalPaymentService } from "../services/paymentService.js";
import paymentDetailsModel from "../models/paymentDetailsModel.js";
import { createGhnOrder, sendOrderConfirmationEmail } from "../utils/orderUtils.js";

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { items, amount, address, shippingFee } = req.body;
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
    // Validate address required fields 
    const requiredAddressFields = [
      "email",
      "street",
      "ward",
      "district",
      "city",
      "country",
      "phone",
    ];

    const missingFields = requiredAddressFields.filter((field) => {
      const value = address[field] || "";
      return !value || value.toString().trim() === "";
    });

    if (missingFields.length > 0) {
      console.log("Missing fields details:");
      missingFields.forEach((field) => {
        console.log(`${field}: "${address[field] || ""}"`);
      });
      return res.json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(", ")}`,
        debug: {
          receivedAddress: address,
          missingFields: missingFields.map((field) => ({
            field,
            value: address[field] || "",
          })),
        },
      });
    }

    // Validate items and fetch weights from productModel
    const itemsWithoutProductId = items.filter(
      (item) => !item._id && !item.productId
    );
    if (itemsWithoutProductId.length > 0) {
      return res.json({
        success: false,
        message: "All items must have a valid product ID",
      });
    }

    // Fetch product weights
    const productIds = items.map((item) => item._id || item.productId);
    const products = await productModel.find({ _id: { $in: productIds } }).select("weight name stock");
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Validate stock and prepare items with weight
    const orderItems = items.map((item) => {
      const product = productMap.get((item._id || item.productId).toString());
      if (!product) {
        throw new Error(`Product not found: ${item.name || item.title}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Sản phẩm${item.name || item.title} hiện chỉ còn ${product.stock} sản phẩm trong kho. Không đủ để đặt. Xin cảm ơn quý khách!`);
      }
      return {
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
        weight: product.weight || 500, // Lấy weight từ productModel, mặc định 500g
      };
    });

    // Reduce stock for pending order (Tránh 2 user cùng đặt hàng mà hết hàng)
    for (const item of orderItems) {
      const product = productMap.get(item.productId.toString());
      await productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
      if (product.stock - item.quantity <= 0) {
        await productModel.findByIdAndUpdate(item.productId, { isAvailable: false });
      }
    }

    // Calculate total weight for GHN
    const totalWeight = orderItems.reduce(
      (total, item) => total + (item.weight || 500) * item.quantity,
      0
    );

    // Calculate shipping fee if address has required GHN fields
    let calculatedShippingFee = shippingFee || 0;
    if (address.districtId && address.wardCode) {
      const shippingResult = await ghnService.calculateShippingFee({
        toDistrictId: address.districtId,
        toWardCode: address.wardCode,
        weight: totalWeight,
      });

      if (shippingResult.success) {
        calculatedShippingFee = shippingResult.data.total || 0;
      } else {
        console.error("GHN calculate shipping fee failed:", shippingResult.message);
      }
    }

    // Verify user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    // Create new order
    const newOrder = new orderModel({
      userId,
      items: orderItems,
      amount,
      shippingFee: calculatedShippingFee,
      totalAmount: amount + calculatedShippingFee,
      address: {
        name: address.name || "",
        email: address.email || "",
        street: address.street || address.address || "",
        ward: address.ward || address.wardName || "",
        district: address.district || address.districtName || "",
        city: address.city || address.provinceName || "",
        zipcode: address.zipcode || address.zipCode || address.zip_code || address.postal_code || "",
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

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: newOrder._id },
    });

    res.json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
      orderId: newOrder._id,
      shippingFee: calculatedShippingFee,
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

    // Check if order can be cancelled (pending and confirmed orders, but not shipped)
    if (order.status === "shipped" || order.status === "delivered" || order.status === "cancelled") {
      return res.json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}. Orders can only be cancelled before shipping.`,
      });
    }

    // Check if order is already cancelled (redundant check since we already check above)
    if (order.status === "cancelled") {
      return res.json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // Update order status to cancelled
    order.status = "cancelled";
    order.updatedAt = Date.now();

    // Cộng lại stock nếu khách hàng hủy đơn
    for (const item of order.items) {
      const product = await productModel.findById(item.productId);
      if (product) {
        await productModel.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
        if (product.stock + item.quantity > 0) {
          await productModel.findByIdAndUpdate(item.productId, { isAvailable: true });
        }
      }
    }
    // Cancel GHN nếu có
    if (order.ghnOrderCode) {
      const cancelResult = await ghnService.cancelOrder([order.ghnOrderCode]);
      if (cancelResult.success) {
        order.ghnOrderCode = null;  // Xóa code sau khi cancel
        order.ghnStatus = "cancelled";
        order.ghnExpectedDeliveryTime = null;
        await order.save();
      } else {
        console.error("GHN cancel failed:", cancelResult.message);
        // Có thể throw error nếu muốn rollback, nhưng ở đây continue
      }
    }

    // Gửi email hủy
    const user = await userModel.findById(order.userId);
    if (user) {
      const emailSubject = `Hủy đơn hàng #${order._id}`;
      await sendOtpEmail(
        user.email,
        null,
        emailSubject,
        "order_cancelled",
        {
          orderId: order._id,
          status: order.status,
          items: order.items,
          amount: order.amount,
          shippingFee: order.shippingFee,
          address: order.address,
          ghnOrderCode: order.ghnOrderCode,
          ghnExpectedDeliveryTime: order.ghnExpectedDeliveryTime,
        }
      );
    }

    // If payment was made, process refund
    if (order.paymentStatus === "paid") {
      // Check if it's a PayPal payment and process refund
      if (order.paymentMethod === "paypal") {
        try {
          // Find payment details
          const paymentDetails = await paymentDetailsModel.findOne({
            orderId: orderId,
            paymentMethod: "paypal",
            gatewayStatus: "completed"
          });

          if (paymentDetails && paymentDetails.paypal?.orderId) {
            // Process PayPal refund
            const refundResult = await refundPayPalPaymentService(
              paymentDetails.paypal.orderId,
              orderId,
              "Order cancelled by customer",
              "customer"
            );

            if (refundResult.success) {
              order.paymentStatus = "refunded";
              console.log(`PayPal refund successful for order ${orderId}: ${refundResult.refundId}`);
            } else {
              console.error(`PayPal refund failed for order ${orderId}: ${refundResult.message}`);
              order.paymentStatus = "refund_pending"; // Mark as pending refund
            }
          } else {
            console.log(`No PayPal payment details found for order ${orderId}`);
            order.paymentStatus = "refunded"; // Assume refunded if no payment details
          }
        } catch (refundError) {
          console.error(`PayPal refund error for order ${orderId}:`, refundError);
          order.paymentStatus = "refund_pending"; // Mark as pending refund
        }
      } else {
        // For other payment methods, just mark as refunded
        order.paymentStatus = "refunded";
      }
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

    const validStatuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await orderModel.findById(orderId).populate("items.productId");
    if (!order) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    const oldStatus = order.status;

    // Xử lý stock/soldQuantity dựa trên transition
    const items = order.items;
    for (const item of items) {
      const productId = item.productId._id;
      const quantity = item.quantity;

      const product = item.productId; // Đã populate
      if (!product) continue;

      // Khi chuyển sang "shipped" từ "confirmed": Tăng soldQuantity
      if (status === "shipped" && oldStatus === "confirmed") {
        await productModel.findByIdAndUpdate(productId, {
          $inc: { soldQuantity: quantity },
        });
      }

      // Khi chuyển sang "cancelled" từ "confirmed" hoặc "pending": Khôi phục stock
      if (status === "cancelled" && (oldStatus === "confirmed" || oldStatus === "pending")) {
        await productModel.findByIdAndUpdate(productId, {
          $inc: { stock: quantity },
        });
        product.isAvailable = true;
        await product.save();
      }
    }
     

    // Khi confirm từ pending
    if (status === "confirmed" && oldStatus === "pending") {
      // Create GHN order
      await createGhnOrder(order);

      // Send confirmation email
      await sendOrderConfirmationEmail(order);
    }

    // Cập nhật status order
    order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedAt = Date.now();

    // Xử lý refund khi admin hủy đơn hàng đã thanh toán
    if (status === "cancelled" && order.paymentStatus === "paid" && order.paymentMethod === "paypal") {
      try {
        // Find payment details
        const paymentDetails = await paymentDetailsModel.findOne({
          orderId: orderId,
          paymentMethod: "paypal",
          gatewayStatus: "completed"
        });

        if (paymentDetails && paymentDetails.paypal?.orderId) {
          // Process PayPal refund
          const refundResult = await refundPayPalPaymentService(
            paymentDetails.paypal.orderId,
            orderId,
            "Order cancelled by admin",
            "admin"
          );

          if (refundResult.success) {
            order.paymentStatus = "refunded";
            console.log(`PayPal refund successful for order ${orderId}: ${refundResult.refundId}`);
          } else {
            console.error(`PayPal refund failed for order ${orderId}: ${refundResult.message}`);
            order.paymentStatus = "refund_pending"; // Mark as pending refund
          }
        } else {
          console.log(`No PayPal payment details found for order ${orderId}`);
          order.paymentStatus = "refunded"; // Assume refunded if no payment details
        }
      } catch (refundError) {
        console.error(`PayPal refund error for order ${orderId}:`, refundError);
        order.paymentStatus = "refund_pending"; // Mark as pending refund
      }
    }

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

    // Calculate total revenue using totalAmount (fallback to amount + shippingFee)
    const revenueResult = await orderModel.aggregate([
      { $match: { status: { $in: ["delivered", "shipped", "confirmed"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [
                { $gt: ["$totalAmount", 0] },
                "$totalAmount",
                { $add: ["$amount", { $ifNull: ["$shippingFee", 0] }] }
              ]
            }
          }
        }
      },
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
          revenue: {
            $sum: {
              $cond: [
                { $gt: ["$totalAmount", 0] },
                "$totalAmount",
                { $add: ["$amount", { $ifNull: ["$shippingFee", 0] }] }
              ]
            }
          },
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
