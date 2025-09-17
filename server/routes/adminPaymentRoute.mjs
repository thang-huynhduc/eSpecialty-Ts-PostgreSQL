import express from "express";
import {
  getAllPaymentDetails,
  getPaymentDetailsByOrderId,
  getPaymentStats,
  getFailedPayments,
  retryFailedPayment,
} from "../controllers/adminPaymentController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();
const routeValue = "/api/admin/payments";

// Get all payment details with pagination and filters
router.get(`${routeValue}`, adminAuth, getAllPaymentDetails);

// Get payment statistics
router.get(`${routeValue}/stats`, adminAuth, getPaymentStats);

// Get failed payments
router.get(`${routeValue}/failed`, adminAuth, getFailedPayments);

// Get payment details by order ID
router.get(`${routeValue}/order/:orderId`, adminAuth, getPaymentDetailsByOrderId);

// Retry failed payment
router.post(`${routeValue}/retry/:paymentId`, adminAuth, retryFailedPayment);

export default router;
