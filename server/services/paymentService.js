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
    const conversionResult = await convertVNDToUSD(orderData.amount);
    
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
      originalAmount: orderData.amount,
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
        vnd: orderData.amount,
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

    // Update payment details
    paymentDetails.paypal.captureId = captureResult.id;
    paymentDetails.paypal.payerInfo = captureResult.payer;
    paymentDetails.gatewayStatus = "completed";
    paymentDetails.gatewayResponse = captureResult;
    paymentDetails.transactionId = captureResult.id;

    await paymentDetails.save();

    // Update order status
    await orderModel.findByIdAndUpdate(orderId, {
      paymentStatus: "paid",
      status: "pending",
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
      // Additional info for transparency (but amount displayed is VND)
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

  return capturedOrder;
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

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: Math.round(order.amount),
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

