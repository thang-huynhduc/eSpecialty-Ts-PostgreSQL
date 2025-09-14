import express from "express";
import {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  createOrder,
  createPayPalOrder,
  capturePayPalPayment,
  handlePayPalWebhook,
} from "../controllers/paymentController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

const routeValue = "/api/payment/";

// Create order
router.post("/api/order/create", userAuth, createOrder);

// Stripe payment routes
router.post(
  `${routeValue}stripe/create-payment-intent`,
  userAuth,
  createPaymentIntent
);
router.post(`${routeValue}stripe/confirm-payment`, userAuth, confirmPayment);

// Stripe webhook (no auth required)
router.post(
  `${routeValue}stripe/webhook`,
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// PayPal payment routes
router.post(
  `${routeValue}paypal/create-order`,
  userAuth,
  createPayPalOrder
);
router.post(
  `${routeValue}paypal/capture-payment`,
  userAuth,
  capturePayPalPayment
);

// PayPal webhook (no auth required)
router.post(
  `${routeValue}paypal/webhook`,
  express.raw({ type: "application/json" }),
  handlePayPalWebhook
);

export default router;
