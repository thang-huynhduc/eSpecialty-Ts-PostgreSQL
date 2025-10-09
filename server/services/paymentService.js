import paymentDetailsModel from "../models/paymentDetailsModel.js";
import orderModel from "../models/orderModel.js";
import { convertVNDToUSD } from "./currencyService.js";
import VNPAY_CONFIG from "../config/vnpay.js";
import crypto from "crypto";
import { VNPay } from "vnpay/vnpay";
import { OrdersController } from "@paypal/paypal-server-sdk";
import paypalClient from "../config/paypal.js";

/**
 * Create PayPal order with currency conversion
 * @param {string} orderId - MongoDB order ID
 * @param {Object} orderData - Order data from database
 * @returns {Promise<Object>} PayPal order creation result
 */
export const createPayPalOrder = async (orderId, orderData) => {
  try {
    // Convert VND to USD
    const conversionResult = await convertVNDToUSD(orderData.amount + orderData.shippingFee);
    
    if (!conversionResult.success) {
      throw new Error(conversionResult.error);
    }

    // Create PayPal order via PayPal SDK/API
    const paypalOrder = await createPayPalOrderViaSDK({
      amount: conversionResult.usdAmount,
      currency: "USD",
      reference: orderId,
    });

    // Save payment details to database
    const paymentDetails = new paymentDetailsModel({
      orderId: orderId,
      paymentMethod: "paypal",
      originalCurrency: "VND",
      originalAmount: orderData.amount + orderData.shippingFee,
      orderTotalAmount: orderData.amount + orderData.shippingFee,
      processedCurrency: "USD",
      processedAmount: conversionResult.usdAmount,
      exchangeRate: conversionResult.exchangeRate,
      paypal: {
        orderId: paypalOrder.id,
      },
      gatewayResponse: paypalOrder,
    });

    await paymentDetails.save();

    return {
      success: true,
      paypalOrderId: paypalOrder.id,
      amount: {
        vnd: orderData.amount + orderData.shippingFee,
        usd: conversionResult.usdAmount,
      },
      exchangeRate: conversionResult.exchangeRate,
      paymentDetailsId: paymentDetails._id,
    };
  } catch (error) {
    console.error("PayPal order creation error:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Capture PayPal payment
 * @param {string} paypalOrderId - PayPal order ID
 * @param {string} orderId - MongoDB order ID
 * @returns {Promise<Object>} Capture result
 */
export const capturePayPalPayment = async (paypalOrderId, orderId) => {
  try {
    // Find payment details
    const paymentDetails = await paymentDetailsModel.findOne({
      orderId: orderId,
      paymentMethod: "paypal",
      "paypal.orderId": paypalOrderId,
    });

    if (!paymentDetails) {
      throw new Error("Payment details not found");
    }

    // Check for idempotency
    if (paymentDetails.paypal.captureId) {
      return {
        success: true,
        alreadyCaptured: true,
        captureId: paymentDetails.paypal.captureId,
        message: "Payment already captured",
      };
    }

    // Increment capture attempts
    paymentDetails.captureAttempts += 1;
    paymentDetails.lastCaptureAttempt = new Date();

    // Capture payment via PayPal SDK
    const captureResult = await capturePayPalOrderViaSDK(paypalOrderId);

    // Get order to ensure we have the latest totalAmount
    const order = await orderModel.findById(orderId);
    
    // Update payment details
    paymentDetails.paypal.captureId = captureResult.id;
    paymentDetails.paypal.payerInfo = captureResult.payer;
    paymentDetails.gatewayStatus = "completed";
    paymentDetails.gatewayResponse = captureResult;
    paymentDetails.transactionId = captureResult.id;
    
    // Store totalAmount from order if not already set
    if (!paymentDetails.orderTotalAmount && order) {
      paymentDetails.orderTotalAmount = (order.totalAmount && order.totalAmount > 0) 
        ? order.totalAmount 
        : (order.amount + (order.shippingFee || 0));
    }

    await paymentDetails.save();

    // Update order status
    await orderModel.findByIdAndUpdate(orderId, {
      paymentStatus: "paid",
      status: "confirmed",
    });

    return {
      success: true,
      captureId: captureResult.id,
      paymentDetails: paymentDetails,
      message: "Payment captured successfully",
    };
  } catch (error) {
    console.error("PayPal capture error:", error);
    
    // Update failed attempt
    const paymentDetails = await paymentDetailsModel.findOne({
      orderId: orderId,
      "paypal.orderId": paypalOrderId,
    });
    
    if (paymentDetails) {
      paymentDetails.gatewayStatus = "failed";
      paymentDetails.gatewayResponse = { error: error.message };
      await paymentDetails.save();
    }

    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get payment details by order ID
 * @param {string} orderId - MongoDB order ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentDetailsByOrderId = async (orderId) => {
  try {
    const paymentDetails = await paymentDetailsModel.findOne({ orderId }).populate('orderId');
    return paymentDetails;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return null;
  }
};

/**
 * Get payment details for admin (display in VND)
 * @param {string} orderId - MongoDB order ID
 * @returns {Promise<Object>} Formatted payment details for admin
 */
export const getPaymentDetailsForAdmin = async (orderId) => {
  try {
    const paymentDetails = await paymentDetailsModel.findOne({ orderId }).populate('orderId');
    
    if (!paymentDetails) {
      return null;
    }

    // Always return amounts in VND for admin display
    return {
      id: paymentDetails._id,
      orderId: paymentDetails.orderId,
      paymentMethod: paymentDetails.paymentMethod,
      amount: paymentDetails.originalAmount, // VND amount
      currency: "VND",
      status: paymentDetails.gatewayStatus,
      transactionId: paymentDetails.transactionId,
      createdAt: paymentDetails.createdAt,
      updatedAt: paymentDetails.updatedAt,
      // Additional info for transparency
      conversionInfo: paymentDetails.processedAmount ? {
        processedAmount: paymentDetails.processedAmount,
        processedCurrency: paymentDetails.processedCurrency,
        exchangeRate: paymentDetails.exchangeRate,
      } : null,
    };
  } catch (error) {
    console.error("Error fetching payment details for admin:", error);
    return null;
  }
};

// PayPal SDK integration


const createPayPalOrderViaSDK = async (orderData) => {
  const ordersController = new OrdersController(paypalClient);
  
  const paypalOrderRequest = {
    intent: "CAPTURE",
    purchaseUnits: [
      {
        amount: {
          currencyCode: orderData.currency,
          value: orderData.amount.toString(),
        },
        description: `Order #${orderData.reference}`,
        customId: orderData.reference,
      },
    ],
    applicationContext: {
      brandName: "eSpecialty Store",
      landingPage: "NO_PREFERENCE",
      userAction: "PAY_NOW",
      returnUrl: `${process.env.CLIENT_URL}/payment-success?orderId=${orderData.reference}`,
      cancelUrl: `${process.env.CLIENT_URL}/checkout/${orderData.reference}`,
    },
  };

  const response = await ordersController.createOrder({
    body: paypalOrderRequest,
    prefer: "return=representation",
  });

  if (response.statusCode !== 201) {
    throw new Error(`PayPal order creation failed: ${response.statusCode}`);
  }

  return response.result;
};

const capturePayPalOrderViaSDK = async (paypalOrderId) => {
  const ordersController = new OrdersController(paypalClient);
  
  const captureResponse = await ordersController.captureOrder({
    id: paypalOrderId,
    prefer: "return=representation",
  });

  if (captureResponse.statusCode !== 201) {
    throw new Error(`PayPal capture failed: ${captureResponse.statusCode}`);
  }

  const capturedOrder = captureResponse.result;
  const capture = capturedOrder.purchaseUnits?.[0]?.payments?.captures?.[0];

  if (!capture || capture.status !== "COMPLETED") {
    throw new Error("Payment capture was not completed");
  }

  return capture;
};

export {
  createPayPalOrderViaSDK,
  capturePayPalOrderViaSDK,
};

/**
 * ==================== VNPay Helpers ====================
 */

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj);
  keys.sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
};

// HMAC SHA512
const hmacSHA512 = (data) => {
  return crypto.createHmac("sha512", VNPAY_CONFIG.secureSecret).update(data, "utf-8").digest("hex");
};

// Singleton VNPay instance
let vnpayInstance;
function getVNPay() {
  if (!vnpayInstance) {
    vnpayInstance = new VNPay({
      tmnCode: VNPAY_CONFIG.tmnCode,
      secureSecret: VNPAY_CONFIG.secureSecret,
      vnpayHost: VNPAY_CONFIG.vnpayHost,
      testMode: true,
      hashAlgorithm: "SHA512",
      endpoints: { paymentEndpoint: VNPAY_CONFIG.paymentEndpoint },
    });
  }
  return vnpayInstance;
}

/**
 * Build VNPay payment URL
 */
export const createVNPayPaymentUrl = async ({ order, clientIp }) => {
  const vnpay = getVNPay();
  const normalizedIp = !clientIp || clientIp.includes(":") ? "127.0.0.1" : clientIp;
  const hasQuery = (VNPAY_CONFIG.returnUrl || "").includes("?");
  const returnUrl = VNPAY_CONFIG.returnUrl
    ? `${VNPAY_CONFIG.returnUrl}${hasQuery ? "&" : "?"}orderId=${order._id.toString()}`
    : "";

  const totalAmountVnd = (typeof order.totalAmount === "number" && order.totalAmount > 0)
    ? order.totalAmount
    : (order.amount + (order.shippingFee || 0));

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: Math.round(totalAmountVnd),
    vnp_IpAddr: normalizedIp,
    vnp_ReturnUrl: returnUrl,
    vnp_TxnRef: order._id.toString(),
    vnp_OrderInfo: `Thanh toan don hang #${order._id}`,
    vnp_Locale: VNPAY_CONFIG.locale,
    vnp_CurrCode: VNPAY_CONFIG.currCode,
  });

  return { success: true, paymentUrl };
};

export const verifyVNPayReturnOrIPN = (params) => {
  const vnpay = getVNPay();
  const result = vnpay.verifyReturnUrl(params);
  return { isValid: result.isSuccess, message: result.message };
};

/**
 * ==================== PayPal Refund Functions ====================
 */

/**
 * Refund PayPal payment
 * @param {string} paypalOrderId - PayPal order ID
 * @param {string} orderId - MongoDB order ID
 * @param {string} reason - Refund reason
 * @param {string} refundedBy - Who initiated the refund (admin/customer)
 * @returns {Promise<Object>} Refund result
 */
export const refundPayPalPayment = async (paypalOrderId, orderId, reason, refundedBy) => {
  try {
    // Find payment details
    let paymentDetails;
    if (paypalOrderId) {
      paymentDetails = await paymentDetailsModel.findOne({
        orderId: orderId,
        paymentMethod: "paypal",
        "paypal.orderId": paypalOrderId,
      });
    } else {
      paymentDetails = await paymentDetailsModel.findOne({
        orderId: orderId,
        paymentMethod: "paypal",
        gatewayStatus: "completed"
      });
    }

    if (!paymentDetails) {
      throw new Error("Payment details not found");
    }
    // Check if already refunded
    if (paymentDetails.paypal.refundId) {
      return {
        success: true,
        alreadyRefunded: true,
        refundId: paymentDetails.paypal.refundId,
        message: "Payment already refunded",
      };
    }

    // Check if payment was captured
    if (!paymentDetails.paypal.captureId) {
      throw new Error("Payment not captured, cannot refund");
    }



    // Refund amount
    const order = await orderModel.findById(orderId);
    // Check if order has been physically shipped 
    const isPreShipment = order && (order.status === "pending" || order.status === "confirmed" || order.status === "cancelled");
    const vndToRefund = isPreShipment
      ? (order.totalAmount && order.totalAmount > 0
          ? order.totalAmount
          : (order.amount + (order.shippingFee || 0)))
      : order.amount;

    // Convert to USD using stored exchange rate, cap by captured amount
    const usdByRate = paymentDetails.exchangeRate
      ? Math.round((vndToRefund * paymentDetails.exchangeRate) * 100) / 100
      : paymentDetails.processedAmount;
    const usdToRefund = Math.min(usdByRate || 0, paymentDetails.processedAmount || 0);

    // Refund payment via PayPal SDK
    const refundResult = await refundPayPalOrderViaSDK(
      paymentDetails.paypal.captureId,
      usdToRefund,
      reason
    );

    // Get/verify totalAmount from order if not stored
    const orderTotalAmount = (order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0));
    
    // Update payment details
    paymentDetails.paypal.refundId = refundResult.id;
    paymentDetails.paypal.refundReason = reason;
    paymentDetails.paypal.refundedBy = refundedBy;
    paymentDetails.paypal.refundedAt = new Date();
    paymentDetails.gatewayStatus = "refunded";
    paymentDetails.gatewayResponse = refundResult;
    
    // Ensure orderTotalAmount is stored
    if (!paymentDetails.orderTotalAmount) {
      paymentDetails.orderTotalAmount = orderTotalAmount;
    }

    await paymentDetails.save();

    // Update order status and add refund history
    await orderModel.findByIdAndUpdate(orderId, {
      paymentStatus: "refunded",
      status: "cancelled",
      $push: {
        refundHistory: {
          refundId: refundResult.id,
          refundAmount: {
            vnd: vndToRefund,
            usd: usdToRefund,
          },
          orderTotalAmount: paymentDetails.orderTotalAmount || orderTotalAmount,
          exchangeRate: paymentDetails.exchangeRate,
          reason: reason,
          refundedBy: refundedBy,
          refundedAt: new Date(),
          status: "completed",
        },
      },
    });

    return {
      success: true,
      refundId: refundResult.id,
      refundAmount: {
        vnd: vndToRefund,
        usd: usdToRefund,
      },
      orderTotalAmount: paymentDetails.orderTotalAmount || orderTotalAmount,
      exchangeRate: paymentDetails.exchangeRate,
      paymentDetails: paymentDetails,
      message: "Payment refunded successfully",
    };
  } catch (error) {
    console.error("PayPal refund error:", error);
    
    // Update failed attempt
    const paymentDetails = await paymentDetailsModel.findOne({
      orderId: orderId,
      "paypal.orderId": paypalOrderId,
    });
    
    if (paymentDetails) {
      paymentDetails.gatewayStatus = "refund_failed";
      paymentDetails.gatewayResponse = { error: error.message };
      await paymentDetails.save();
    }

    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Get refund details by order ID
 * @param {string} orderId - MongoDB order ID
 * @returns {Promise<Object>} Refund details
 */
export const getRefundDetailsByOrderId = async (orderId) => {
  try {
    const paymentDetails = await paymentDetailsModel.findOne({ orderId }).populate('orderId');
    
    if (!paymentDetails || !paymentDetails.paypal.refundId) {
      return null;
    }
    
    // Get order to ensure we have totalAmount for fallback
    const order = paymentDetails.orderId;
    const orderTotalAmount = paymentDetails.orderTotalAmount || 
      ((order.totalAmount && order.totalAmount > 0) ? order.totalAmount : (order.amount + (order.shippingFee || 0)));

    return {
      refundId: paymentDetails.paypal.refundId,
      refundReason: paymentDetails.paypal.refundReason,
      refundedBy: paymentDetails.paypal.refundedBy,
      refundedAt: paymentDetails.paypal.refundedAt,
      refundAmount: {
        vnd: paymentDetails.originalAmount,
        usd: paymentDetails.processedAmount,
      },
      orderTotalAmount: orderTotalAmount,
      exchangeRate: paymentDetails.exchangeRate,
      status: paymentDetails.gatewayStatus,
    };
  } catch (error) {
    console.error("Error fetching refund details:", error);
    return null;
  }
};

/**
 * Refund PayPal order via REST API
 * @param {string} captureId - PayPal capture ID
 * @param {number} amount - Amount to refund in USD
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} Refund result
 */
const refundPayPalOrderViaSDK = async (captureId, amount, reason) => {
  try {
    // Get access token
    const accessToken = await getPayPalAccessToken();
    
    const refundRequest = {
      amount: {
        value: amount.toString(),
        currency_code: "USD",
      },
      note_to_payer: reason,
    };

    const response = await fetch(`https://api-m.sandbox.paypal.com/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `refund-${Date.now()}`,
      },
      body: JSON.stringify(refundRequest),
    });

    const refund = await response.json();

    if (!response.ok) {
      throw new Error(`PayPal refund failed: ${response.status} - ${refund.message || 'Unknown error'}`);
    }

    if (!refund || refund.status !== "COMPLETED") {
      throw new Error("Refund was not completed");
    }

    return refund;
  } catch (error) {
    console.error("PayPal refund API error:", error);
    throw error;
  }
};

/**
 * Get PayPal access token
 * @returns {Promise<string>} Access token
 */
const getPayPalAccessToken = async () => {
  try {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const baseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${data.error_description || 'Unknown error'}`);
    }

    return data.access_token;
  } catch (error) {
    console.error("Error getting PayPal access token:", error);
    throw error;
  }
};

