import { OrdersController } from "@paypal/paypal-server-sdk";
import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import paypalClient, { PAYPAL_WEBHOOK_CONFIG, SUPPORTED_PAYPAL_EVENTS } from "../config/paypal.js";
import { convertVNDToUSD, isPayPalSupportedCurrency } from "../services/currencyService.js";
import { createPayPalOrder as createPayPalOrderService, capturePayPalPayment as capturePayPalPaymentService, createVNPayPaymentUrl, verifyVNPayReturnOrIPN, refundPayPalPayment as refundPayPalPaymentService, getRefundDetailsByOrderId } from "../services/paymentService.js";
import paymentDetailsModel from "../models/paymentDetailsModel.js";
import { sendOtpEmail } from "../services/emaiService.js";
import { createGhnOrder, sendOrderConfirmationEmail, sendPaymentConfirmationEmail } from "../utils/orderUtils.js";
import productModel from "../models/productModel.js";

// Create payment intent for Stripe
export const createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === "paid") {
      return res.json({ success: false, message: "Order is already paid" });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        orderId: order._id.toString(),
        userId: userId,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Create Payment Intent Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Confirm payment and update order status
export const confirmPayment = async (req, res) => {
  try {
      const { paymentIntentId, orderId } = req.body;
      const userId = req.user.id;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === "succeeded") {
      const order = await orderModel.findById(orderId).populate("items.productId");
      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }

      if (order.userId.toString() !== userId.toString()) {
        return res.json({
          success: false,
          message: "Unauthorized access to order",
        });
      }

      order.paymentStatus = "paid";
      order.paymentMethod = "stripe";
      order.status = "confirmed";
      await order.save();

      // Create GHN order
      const ghnResult = await createGhnOrder(order);
      console.log('confirmPayment ~ createGhnOrder:', ghnResult);
      if (!ghnResult.success) {
        console.error("GHN creation failed:", ghnResult.message);
        // Continue despite GHN failure, log for admin review
      }

      // Send confirmation email with GHN details
      await sendOrderConfirmationEmail(order);

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        order,
      });
    } else {
      const order = await orderModel.findById(orderId);
      if (order) {
        order.paymentStatus = "failed";
        await order.save();

        // Send failure email
        const user = await userModel.findById(order.userId);
        if (user) {
          const emailSubject = `Thanh toán đơn hàng #${order._id} thất bại`;
          await sendOtpEmail(
            user.email,
            null,
            emailSubject,
            "payment_failed",
            {
              orderId: order._id,
              items: order.items,
              amount: order.amount,
              shippingFee: order.shippingFee,
              address: order.address,
              retryUrl: `${process.env.CLIENT_URL}/checkout/${order._id}`,
            }
          );
        }
      }
      res.json({
        success: false,
        message: "Payment not completed",
      });
    }
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

// Handle Stripe webhook for payment updates
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      const order = await orderModel.findById(orderId).populate("items.productId");
      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.status = "confirmed";
        await order.save();

        // Create GHN order
        const ghnResult = await createGhnOrder(order);
        console.log(' ~ createGhnOrder:', ghnResult);
        if (!ghnResult.success) {
          console.error("GHN creation failed:", ghnResult.message);
          // Continue despite GHN failure, log for admin review
        }

        // Send confirmation email with GHN details
        await sendOrderConfirmationEmail(order);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      const failedOrderId = failedPayment.metadata.orderId;

      const failedOrder = await orderModel.findById(failedOrderId);
      if (failedOrder) {
        failedOrder.paymentStatus = "failed";
        await failedOrder.save();

        // Send failure email
        const user = await userModel.findById(failedOrder.userId);
        if (user) {
          const emailSubject = `Thanh toán đơn hàng #${failedOrder._id} thất bại`;
          await sendOtpEmail(
            user.email,
            null,
            emailSubject,
            "payment_failed",
            {
              orderId: failedOrder._id,
              items: failedOrder.items,
              amount: failedOrder.amount,
              shippingFee: failedOrder.shippingFee,
              address: failedOrder.address,
              retryUrl: `${process.env.CLIENT_URL}/checkout/${failedOrder._id}`,
            }
          );
        }
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
};

// Create order with payment method selection
// ==================== PAYPAL FUNCTIONS ====================

// Create PayPal order
export const createPayPalOrder = async (req, res) => {
  try {
    const { orderId, currency = "VND" } = req.body;
    const userId = req.user.id;


    // Find the existing order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === "paid") {
      return res.json({ success: false, message: "Order is already paid" });
    }

    // Check if PayPal payment details already exist
    const existingPaymentDetails = await paymentDetailsModel.findOne({
      orderId: orderId,
      paymentMethod: "paypal",
      gatewayStatus: { $in: ["completed", "pending"] }
    });

    if (existingPaymentDetails && existingPaymentDetails.gatewayStatus === "completed") {
      return res.json({
        success: false,
        message: "PayPal payment already completed",
      });
    }

    // Validate currency support
    if (currency !== "VND" && !isPayPalSupportedCurrency(currency)) {
      return res.json({
        success: false,
        message: "Currency not supported by PayPal",
      });
    }

    // Use payment service to create PayPal order
    const result = await createPayPalOrderService(orderId, order);

    if (!result.success) {
      return res.json({
        success: false,
        message: result.message || "Failed to create PayPal order",
      });
    }

    // Update order with payment method and hasPaymentDetails flag
    order.paymentMethod = "paypal";
    order.hasPaymentDetails = true;
    await order.save();

    // Find approve URL from PayPal response
    const approveUrl = result.gatewayResponse?.links?.find(link => link.rel === "approve")?.href;

    res.json({
      success: true,
      paypalOrderId: result.paypalOrderId,
      approveUrl,
      amount: result.amount,
      exchangeRate: result.exchangeRate,
      message: "PayPal order created successfully",
    });

  } catch (error) {
    console.error("Create PayPal Order Error:", error);
    
    // Log for audit
    console.error("PayPal Order Creation Audit:", {
      orderId: req.body.orderId,
      userId: req.user?.id,
      currency: req.body.currency,
      timestamp: new Date().toISOString(),
      error: error.message,
    });

    res.json({
      success: false,
      message: "PayPal service is currently unavailable. Please try again later.",
    });
  }
};

// Capture PayPal payment
export const capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    const userId = req.user.id;

    // Find the order
    const order = await orderModel.findById(orderId).populate("items.productId");
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Use payment service to capture PayPal payment
    const result = await capturePayPalPaymentService(paypalOrderId, orderId);

    if (!result.success) {
      order.paymentStatus = "failed";
      await order.save();
      return res.json({
        success: false,
        message: result.message || "Payment capture failed",
      });
    }

    // Update order if not already paid
    if (!result.alreadyCaptured && order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.paymentMethod = "paypal";
      order.status = "confirmed";
      await order.save();

      // Create GHN order
      const ghnResult = await createGhnOrder(order);
      if (!ghnResult.success) {
        console.error("GHN creation failed:", ghnResult.message);
        // Continue despite GHN failure, log for admin review
      }

      // Send confirmation email with GHN details
      await sendPaymentConfirmationEmail(order);
    }

    res.json({
      success: true,
      message: result.message,
      order,
      captureId: result.captureId,
      alreadyCaptured: result.alreadyCaptured || false,
    });
  } catch (error) {
    console.error("Capture PayPal Payment Error:", error);
    console.error("PayPal Capture Audit:", {
      paypalOrderId: req.body.paypalOrderId,
      orderId: req.body.orderId,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      error: error.message,
    });

    const order = await orderModel.findById(req.body.orderId);
    if (order) {
      order.paymentStatus = "failed";
      await order.save();

      // Send failure email
      const user = await userModel.findById(order.userId);
      if (user) {
        const emailSubject = `Thanh toán đơn hàng #${order._id} thất bại`;
        await sendOtpEmail(
          user.email,
          null,
          emailSubject,
          "payment_failed",
          {
            orderId: order._id,
            items: order.items,
            amount: order.amount,
            shippingFee: order.shippingFee,
            address: order.address,
            retryUrl: `${process.env.CLIENT_URL}/checkout/${order._id}`,
          }
        );
      }
    }

    res.json({
      success: false,
      message: "Payment capture failed. Please try again.",
    });
  }
};

// Handle PayPal webhook
export const handlePayPalWebhook = async (req, res) => {
  try {
    const webhookBody = req.body;
    const webhookSignature = req.headers["paypal-transmission-signature"];
    const webhookId = req.headers["paypal-transmission-id"];
    const webhookTimestamp = req.headers["paypal-transmission-time"];
    const certId = req.headers["paypal-cert-id"];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", PAYPAL_WEBHOOK_CONFIG.webhookSecret)
      .update(JSON.stringify(webhookBody))
      .digest("base64");

    if (webhookSignature !== expectedSignature) {
      console.error("PayPal webhook signature verification failed");
      return res.status(401).send("Unauthorized");
    }

    const eventType = webhookBody.event_type;

    if (!SUPPORTED_PAYPAL_EVENTS.includes(eventType)) {
      console.log(`Unhandled PayPal event type: ${eventType}`);
      return res.json({ received: true });
    }

    console.log(`Processing PayPal webhook: ${eventType}`);

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        const resource = webhookBody.resource;
        const paymentDetails = await paymentDetailsModel.findOne({
          "paypal.captureId": resource.id,
        });
        if (paymentDetails) {
          const order = await orderModel.findById(paymentDetails.orderId).populate("items.productId");
          if (order && order.paymentStatus !== "paid") {
            paymentDetails.gatewayStatus = "completed";
            paymentDetails.gatewayResponse = resource;
            await paymentDetails.save();

            order.paymentStatus = "paid";
            order.status = "confirmed";
            await order.save();

            // Create GHN order
            const ghnResult = await createGhnOrder(order);
            console.log('handlePayPalWebhook ~ createGhnOrder:', ghnResult);
            if (!ghnResult.success) {
              console.error("GHN creation failed:", ghnResult.message);
              // Continue despite GHN failure, log for admin review
            }

            // Send confirmation email with GHN details
            await sendPaymentConfirmationEmail(order);
          }
        }
        break;

      case "CHECKOUT.ORDER.COMPLETED":
        const paypalOrderId = webhookBody.resource.id;
        const order = await orderModel.findOne({ paypalOrderId }).populate("items.productId");
        if (order && order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.status = "confirmed";
          await order.save();

          // Create GHN order
          const ghnResult = await createGhnOrder(order);
          console.log('handlePayPalWebhook ~ ghnResult:', ghnResult);
          if (!ghnResult.success) {
            console.error("GHN creation failed:", ghnResult.message);
            // Continue despite GHN failure, log for admin review
          }

          // Send confirmation email with GHN details
          await sendPaymentConfirmationEmail(order);
        }
        break;

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REVERSED":
        const captureId = webhookBody.resource.id;
        const deniedOrder = await orderModel.findOne({ paypalCaptureId: captureId });
        if (deniedOrder) {
          deniedOrder.paymentStatus = "failed";
          await deniedOrder.save();

          // Send failure email
          const user = await userModel.findById(deniedOrder.userId);
          if (user) {
            const emailSubject = `Thanh toán đơn hàng #${deniedOrder._id} thất bại`;
            await sendOtpEmail(
              user.email,
              null,
              emailSubject,
              "payment_failed",
              {
                orderId: deniedOrder._id,
                items: deniedOrder.items,
                amount: deniedOrder.amount,
                shippingFee: deniedOrder.shippingFee,
                address: deniedOrder.address,
                retryUrl: `${process.env.CLIENT_URL}/checkout/${deniedOrder._id}`,
              }
            );
          }
        }
        break;

      case "PAYMENT.CAPTURE.PENDING":
        await handlePaymentCapturePending(webhookBody.resource);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        await handlePaymentCaptureRefunded(webhookBody.resource);
        break;

      case "CHECKOUT.ORDER.APPROVED":
        await handleCheckoutOrderApproved(webhookBody.resource);
        break;

      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// Webhook event handlers
const handlePaymentCaptureCompleted = async (resource) => {
  try {
    const captureId = resource.id;
    
    // Find payment details first
    const paymentDetails = await paymentDetailsModel.findOne({ 
      "paypal.captureId": captureId 
    });
    
    if (paymentDetails) {
      // Update payment details
      paymentDetails.gatewayStatus = "completed";
      paymentDetails.gatewayResponse = resource;
      await paymentDetails.save();
      
      // Update order
      const order = await orderModel.findById(paymentDetails.orderId);
      if (order) {
              order.paymentStatus = "paid";
              order.status = "confirmed";
              await order.save();
        console.log(`Order ${order._id} payment confirmed via webhook`);
      }
    }
  } catch (error) {
    console.error("Error handling payment capture completed:", error);
  }
};

const handlePaymentCaptureDenied = async (resource) => {
  try {
    const captureId = resource.id;
    const order = await orderModel.findOne({ paypalCaptureId: captureId });
    if (order) {
      order.paymentStatus = "failed";
      await order.save();
      console.log(`Order ${order._id} payment denied via webhook`);

      // Send failure email
      const user = await userModel.findById(order.userId);
      if (user) {
        const emailSubject = `Thanh toán đơn hàng #${order._id} thất bại`;
        await sendOtpEmail(
          user.email,
          null,
          emailSubject,
          "payment_failed",
          {
            orderId: order._id,
            items: order.items,
            amount: order.amount,
            shippingFee: order.shippingFee,
            address: order.address,
            retryUrl: `${process.env.CLIENT_URL}/checkout/${order._id}`,
          }
        );
      }
    }
  } catch (error) {
    console.error("Error handling payment capture denied:", error);
  }
};

const handlePaymentCapturePending = async (resource) => {
  try {
    const captureId = resource.id;
    const order = await orderModel.findOne({ paypalCaptureId: captureId });
    
    if (order && order.paymentStatus !== "paid") {
      order.paymentStatus = "pending";
      await order.save();
      console.log(`Order ${order._id} payment pending via webhook`);
    }
  } catch (error) {
    console.error("Error handling payment capture pending:", error);
  }
};

const handlePaymentCaptureRefunded = async (resource) => {
  try {
    const captureId = resource.id;
    const order = await orderModel.findOne({ paypalCaptureId: captureId });
    
    if (order) {
      order.paymentStatus = "refunded";
      order.status = "cancelled";
      await order.save();
      console.log(`Order ${order._id} payment refunded via webhook`);
    }
  } catch (error) {
    console.error("Error handling payment capture refunded:", error);
  }
};

const handlePaymentCaptureReversed = async (resource) => {
  try {
    const captureId = resource.id;
    const order = await orderModel.findOne({ paypalCaptureId: captureId });
    if (order) {
      order.paymentStatus = "failed";
      await order.save();
      console.log(`Order ${order._id} payment reversed via webhook`);

      // Send failure email
      const user = await userModel.findById(order.userId);
      if (user) {
        const emailSubject = `Thanh toán đơn hàng #${order._id} thất bại`;
        await sendOtpEmail(
          user.email,
          null,
          emailSubject,
          "payment_failed",
          {
            orderId: order._id,
            items: order.items,
            amount: order.amount,
            shippingFee: order.shippingFee,
            address: order.address,
            retryUrl: `${process.env.CLIENT_URL}/checkout/${order._id}`,
          }
        );
      }
    }
  } catch (error) {
    console.error("Error handling payment capture reversed:", error);
  }
};

const handleCheckoutOrderApproved = async (resource) => {
  try {
    const paypalOrderId = resource.id;
    const order = await orderModel.findOne({ paypalOrderId });
    
    if (order) {
      // Order approved but not yet captured
      console.log(`PayPal order ${paypalOrderId} approved, waiting for capture`);
    }
  } catch (error) {
    console.error("Error handling checkout order approved:", error);
  }
};

const handleCheckoutOrderCompleted = async (resource) => {
  try {
    const paypalOrderId = resource.id;
    const order = await orderModel.findOne({ paypalOrderId });
    
    if (order) {
      // This should already be handled by capture completed, but good to have as backup
      if (order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        //order.status = "confirmed";
        await order.save();
        console.log(`Order ${order._id} completed via webhook`);
      }
    }
  } catch (error) {
    console.error("Error handling checkout order completed:", error);
  }
};

// Refund PayPal payment
export const refundPayPalPayment = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user (for customer) or user is admin
    if (userRole !== "admin" && order.userId.toString() !== userId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Check if order is paid
    if (order.paymentStatus !== "paid") {
      return res.json({ 
        success: false, 
        message: "Order is not paid, cannot refund" 
      });
    }

    // Check if already refunded
    if (order.paymentStatus === "refunded") {
      return res.json({ 
        success: false, 
        message: "Order is already refunded" 
      });
    }

    // Use payment service to refund PayPal payment
    const result = await refundPayPalPaymentService(
      null, // paypalOrderId will be found from payment details
      orderId, 
      reason || "Order cancellation", 
      userRole === "admin" ? "admin" : "customer"
    );

    if (!result.success) {
      return res.json({
        success: false,
        message: result.message || "Refund failed",
      });
    }

    // Send refund notification email
    const user = await userModel.findById(order.userId);
    if (user) {
      const emailSubject = `Hoàn tiền đơn hàng #${order._id}`;
      
      await sendOtpEmail(
        user.email,
        null,
        emailSubject,
        "refund_notification",
        {
          orderId: order._id,
          refundId: result.refundId,
          refundAmount: result.refundAmount,
          exchangeRate: result.exchangeRate,
          reason: reason || "Order cancellation",
          refundedBy: userRole === "admin" ? "admin" : "customer",
        }
      );
    }

    res.json({
      success: true,
      message: result.message,
      refundId: result.refundId,
      refundAmount: result.refundAmount,
      exchangeRate: result.exchangeRate,
    });

  } catch (error) {
    console.error("Refund PayPal Payment Error:", error);
    
    // Log for audit
    console.error("PayPal Refund Audit:", {
      paypalOrderId: req.body.paypalOrderId,
      orderId: req.body.orderId,
      userId: req.user?.id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString(),
      error: error.message,
    });

    res.json({
      success: false,
      message: "Refund failed. Please try again.",
    });
  }
};

// Get refund details
export const getRefundDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user (for customer) or user is admin
    if (userRole !== "admin" && order.userId.toString() !== userId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Get refund details
    const refundDetails = await getRefundDetailsByOrderId(orderId);

    if (!refundDetails) {
      return res.json({ 
        success: false, 
        message: "No refund found for this order" 
      });
    }

    res.json({
      success: true,
      refundDetails: refundDetails,
    });

  } catch (error) {
    console.error("Get Refund Details Error:", error);
    res.json({
      success: false,
      message: "Failed to get refund details",
    });
  }
};

// ==================== END PAYPAL FUNCTIONS ====================

export const createOrder = async (req, res) => {
  try {
    const { items, address, paymentMethod = "cod" } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: "Order items are required" });
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
      "zipcode",
      "country",
      "phone",
    ];
    const missingFields = requiredAddressFields.filter((field) => {
      const value =
        address[field] || address[field === "zipcode" ? "zipCode" : field];
      return !value || value.trim() === "";
    });

    if (missingFields.length > 0) {
      return res.json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(", ")}`,
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

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    // Create order
    const order = new orderModel({
      userId,
      items: items.map((item) => ({
        productId: item._id || item.productId,
        name: item.name || item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.images?.[0] || item.image,
      })),
      amount: totalAmount,
      address: {
        name: address.name || address.name?.split(" ")[0] || "",
        lastName:
          address.name?.split(" ").slice(1).join(" ") || "",  
        email: address.email || "",
        street: address.street || "",
        ward: address.ward || "",
        district: address.district || "",
        city: address.city || "",
        zipcode: address.zipcode || address.zipCode || "",
        country: address.country || "Vietnam",
        phone: address.phone || "",
      },
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
      status: "pending",
    });

    await order.save();

    // Add order to user's orders array
    await userModel.findByIdAndUpdate(userId, {
      $push: { orders: order._id },
    });

    res.json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
      order: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.json({ success: false, message: error.message });
  }
};

/* VNPAY FUNCTIONS*/

export const createVNPayPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.userId.toString() !== userId.toString()) {
      return res.json({ success: false, message: "Unauthorized access to order" });
    }

    if (order.paymentStatus === "paid") {
      return res.json({ success: false, message: "Order is already paid" });
    }   

    // Upsert payment details 
    let paymentDetails = await paymentDetailsModel.findOne({ orderId: orderId, paymentMethod: "vnpay" });

    if (!paymentDetails) {
      paymentDetails = new paymentDetailsModel({
        orderId: orderId,
        paymentMethod: "vnpay",
        originalCurrency: "VND",
        originalAmount: order.amount,
        gatewayStatus: "pending",
      });
      await paymentDetails.save();
    }

    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.connection.remoteAddress || "127.0.0.1";
    const buildUrl = await createVNPayPaymentUrl({ order, clientIp });
    if (!buildUrl.success) {
      return res.json({ success: false, message: "Failed to build VNPay URL" });
    }
    res.json({ success: true, paymentUrl: buildUrl.paymentUrl });
  } catch (error) {
    console.error("Create VNPay Payment Error:", error);
    res.json({ success: false, message: error.message });
  }
};

export const vnpayReturnHandler = async (req, res) => {
  try {
    const params = req.query;
    const { isValid } = verifyVNPayReturnOrIPN(params);
    const orderId = params["vnp_TxnRef"];
    const responseCode = params["vnp_ResponseCode"];

    if (!orderId) {
      return res.json({ success: false, message: "Missing order reference" });
    }

    const order = await orderModel.findById(orderId).populate("items.productId");
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Update payment details
    const paymentDetails = await paymentDetailsModel.findOne({ orderId: orderId, paymentMethod: "vnpay" });
    if (paymentDetails) {
      paymentDetails.transactionId = params["vnp_TransactionNo"] || paymentDetails.transactionId;
      paymentDetails.gatewayStatus = responseCode === "00" ? "completed" : "failed";
      paymentDetails.gatewayResponse = params;
      await paymentDetails.save();
    }

    if (!isValid || responseCode !== "00") {
      order.paymentStatus = "failed";
      await order.save();

      // Send failure email
      const user = await userModel.findById(order.userId);
      if (user) {
        const emailSubject = `Thanh toán đơn hàng #${order._id} thất bại`;
        await sendOtpEmail(
          user.email,
          null,
          emailSubject,
          "payment_failed",
          {
            orderId: order._id,
            items: order.items,
            amount: order.amount,
            shippingFee: order.shippingFee,
            address: order.address,
            retryUrl: `${process.env.CLIENT_URL}/checkout/${order._id}`,
          }
        );
      }

      return res.redirect(`${process.env.CLIENT_URL}/payment-failed?orderId=${orderId}`);
    }

    // Payment success
    order.paymentStatus = "paid";
    order.paymentMethod = "vnpay";
    order.status = "confirmed";
    await order.save();

    // Create GHN order
    const ghnResult = await createGhnOrder(order);
    if (!ghnResult.success) {
      console.error("GHN creation failed:", ghnResult.message);
      // Continue despite GHN failure, log for admin review
    }

    // Send confirmation email with GHN details
    await sendPaymentConfirmationEmail(order);

    const redirectUrl = `${process.env.CLIENT_URL}/payment-success?orderId=${orderId}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("VNPay Return Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const vnpayIpnHandler = async (req, res) => {
  try {
    const params = req.query;
    const { isValid } = verifyVNPayReturnOrIPN(params);
    const orderId = params["vnp_TxnRef"];
    const responseCode = params["vnp_ResponseCode"];

    if (!orderId) {
      return res.json({ RspCode: "01", Message: "Missing order reference" });
    }

    if (!isValid) {
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }

    const order = await orderModel.findById(orderId).populate("items.productId");
    if (!order) {
      return res.json({ RspCode: "02", Message: "Order not found" });
    }

    // Idempotent update
    if (order.paymentStatus !== "paid") {
      const paymentDetails = await paymentDetailsModel.findOne({ orderId: orderId, paymentMethod: "vnpay" });
      if (paymentDetails) {
        paymentDetails.transactionId = params["vnp_TransactionNo"] || paymentDetails.transactionId;
        paymentDetails.gatewayStatus = responseCode === "00" ? "completed" : "failed";
        paymentDetails.gatewayResponse = params;
        await paymentDetails.save();
      }

      if (responseCode === "00") {
        order.paymentStatus = "paid";
        order.paymentMethod = "vnpay";
        order.status = "confirmed";
        await order.save();

        // Create GHN order
        const ghnResult = await createGhnOrder(order);
        if (!ghnResult.success) {
          console.error("GHN creation failed:", ghnResult.message);
          // Continue despite GHN failure, log for admin review
        }

        // Send confirmation email with GHN details
        await sendPaymentConfirmationEmail(order);
      } else {
        order.paymentStatus = "failed";
        await order.save();

        // Send failure email
        const user = await userModel.findById(order.userId);
        if (user) {
          const emailSubject = `Thanh toán đơn hàng #${order._id} thất bại`;
          await sendOtpEmail(
            user.email,
            null,
            emailSubject,
            "payment_failed",
            {
              orderId: order._id,
              items: order.items,
              amount: order.amount,
              shippingFee: order.shippingFee,
              address: order.address,
              retryUrl: `${process.env.CLIENT_URL}/checkout/${order._id}`,
            }
          );
        }
      }
    }

    res.json({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("VNPay IPN Error:", error);
    res.json({ RspCode: "99", Message: "Unknown error" });
  }
};
