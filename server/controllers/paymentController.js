import { OrdersController } from "@paypal/paypal-server-sdk";
import crypto from "crypto";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import paypalClient, { PAYPAL_WEBHOOK_CONFIG, SUPPORTED_PAYPAL_EVENTS } from "../config/paypal.js";
import { convertVNDToUSD, isPayPalSupportedCurrency } from "../services/currencyService.js";
import { createPayPalOrder as createPayPalOrderService, capturePayPalPayment as capturePayPalPaymentService } from "../services/paymentService.js";
import paymentDetailsModel from "../models/paymentDetailsModel.js";



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
    if (order.userId.toString() !== userId) {
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

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update order payment status
      const order = await orderModel.findById(orderId);
      if (!order) {
        return res.json({ success: false, message: "Order not found" });
      }

      // Verify order belongs to user
      if (order.userId.toString() !== userId) {
        return res.json({
          success: false,
          message: "Unauthorized access to order",
        });
      }

      order.paymentStatus = "paid";
      order.paymentMethod = "stripe";
      order.status = "confirmed";
      await order.save();

      res.json({
        success: true,
        message: "Payment confirmed successfully",
        order: order,
      });
    } else {
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

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      // Update order status
      await orderModel.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        status: "confirmed",
      });
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      const failedOrderId = failedPayment.metadata.orderId;

      // Update order status
      await orderModel.findByIdAndUpdate(failedOrderId, {
        paymentStatus: "failed",
      });
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
    if (order.userId.toString() !== userId) {
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
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify order belongs to user
    if (order.userId.toString() !== userId) {
      return res.json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    // Use payment service to capture PayPal payment
    const result = await capturePayPalPaymentService(paypalOrderId, orderId);

    if (!result.success) {
      return res.json({
        success: false,
        message: result.message || "Payment capture failed",
      });
    }

    res.json({
      success: true,
      message: result.message,
      order: order,
      captureId: result.captureId,
      alreadyCaptured: result.alreadyCaptured || false,
    });

  } catch (error) {
    console.error("Capture PayPal Payment Error:", error);
    
    // Log for audit
    console.error("PayPal Capture Audit:", {
      paypalOrderId: req.body.paypalOrderId,
      orderId: req.body.orderId,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
      error: error.message,
    });

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

    // Basic signature verification
    if (webhookSignature !== expectedSignature) {
      console.error("PayPal webhook signature verification failed");
      return res.status(401).send("Unauthorized");
    }

    const eventType = webhookBody.event_type;
    
    // Check if we handle this event type
    if (!SUPPORTED_PAYPAL_EVENTS.includes(eventType)) {
      console.log(`Unhandled PayPal event type: ${eventType}`);
      return res.json({ received: true });
    }

    console.log(`Processing PayPal webhook: ${eventType}`);

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCaptureCompleted(webhookBody.resource);
        break;

      case "PAYMENT.CAPTURE.DENIED":
        await handlePaymentCaptureDenied(webhookBody.resource);
        break;

      case "PAYMENT.CAPTURE.PENDING":
        await handlePaymentCapturePending(webhookBody.resource);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        await handlePaymentCaptureRefunded(webhookBody.resource);
        break;

      case "PAYMENT.CAPTURE.REVERSED":
        await handlePaymentCaptureReversed(webhookBody.resource);
        break;

      case "CHECKOUT.ORDER.APPROVED":
        await handleCheckoutOrderApproved(webhookBody.resource);
        break;

      case "CHECKOUT.ORDER.COMPLETED":
        await handleCheckoutOrderCompleted(webhookBody.resource);
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
      order.status = "cancelled";
      await order.save();
      console.log(`Order ${order._id} payment reversed via webhook`);
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
        order.status = "confirmed";
        await order.save();
        console.log(`Order ${order._id} completed via webhook`);
      }
    }
  } catch (error) {
    console.error("Error handling checkout order completed:", error);
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
        firstName: address.firstName || address.name?.split(" ")[0] || "",
        lastName:
          address.lastName || address.name?.split(" ").slice(1).join(" ") || "",
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
