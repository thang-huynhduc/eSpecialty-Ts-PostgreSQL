import paymentDetailsModel from "../models/paymentDetailsModel.js";
import orderModel from "../models/orderModel.js";
import { getPaymentDetailsForAdmin } from "../services/paymentService.js";

/**
 * Get all payment details for admin (display in VND)
 */
export const getAllPaymentDetails = async (req, res) => {
  try {
    const { page = 1, limit = 10, paymentMethod, status } = req.query;
    
    // Build filter
    const filter = {};
    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }
    if (status) {
      filter.gatewayStatus = status;
    }

    const skip = (page - 1) * limit;
    
    const paymentDetails = await paymentDetailsModel
      .find(filter)
      .populate('orderId', 'amount status userId date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await paymentDetailsModel.countDocuments(filter);

    // Format for admin display (always VND)
    const formattedPayments = paymentDetails.map(payment => ({
      id: payment._id,
      orderId: payment.orderId._id,
      orderAmount: payment.originalAmount, // Always show VND amount
      orderCurrency: "VND",
      paymentMethod: payment.paymentMethod,
      status: payment.gatewayStatus,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      // Additional context for admin (but amount displayed is VND)
      conversionInfo: payment.processedAmount ? {
        processedAmount: payment.processedAmount,
        processedCurrency: payment.processedCurrency,
        exchangeRate: payment.exchangeRate,
      } : null,
    }));

    res.json({
      success: true,
      payments: formattedPayments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Get all payment details error:", error);
    res.json({ success: false, message: error.message });
  }
};

/**
 * Get payment details by order ID for admin
 */
export const getPaymentDetailsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const paymentDetails = await getPaymentDetailsForAdmin(orderId);
    
    if (!paymentDetails) {
      return res.json({ 
        success: false, 
        message: "Payment details not found" 
      });
    }

    res.json({
      success: true,
      paymentDetails
    });
  } catch (error) {
    console.error("Get payment details by order ID error:", error);
    res.json({ success: false, message: error.message });
  }
};

/**
 * Get payment statistics for admin dashboard
 */
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get payment method breakdown
    const methodStats = await paymentDetailsModel.aggregate([
      { $match: { ...dateFilter, gatewayStatus: "completed" } },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$originalAmount" }, // VND amount
        }
      }
    ]);

    // Get status breakdown
    const statusStats = await paymentDetailsModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$gatewayStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$originalAmount" }, // VND amount
        }
      }
    ]);

    // Get total revenue (in VND)
    const totalRevenue = await paymentDetailsModel.aggregate([
      { 
        $match: { 
          ...dateFilter, 
          gatewayStatus: "completed" 
        } 
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$originalAmount" }, // VND amount
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        methods: methodStats,
        statuses: statusStats,
        revenue: {
          total: totalRevenue[0]?.total || 0,
          currency: "VND",
          transactions: totalRevenue[0]?.count || 0,
        }
      }
    });
  } catch (error) {
    console.error("Get payment stats error:", error);
    res.json({ success: false, message: error.message });
  }
};

/**
 * Get failed payments for admin review
 */
export const getFailedPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const failedPayments = await paymentDetailsModel
      .find({ gatewayStatus: "failed" })
      .populate('orderId', 'amount status userId date')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await paymentDetailsModel.countDocuments({ gatewayStatus: "failed" });

    // Format for admin display (always VND)
    const formattedPayments = failedPayments.map(payment => ({
      id: payment._id,
      orderId: payment.orderId._id,
      orderAmount: payment.originalAmount, // VND amount
      orderCurrency: "VND",
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      captureAttempts: payment.captureAttempts,
      lastCaptureAttempt: payment.lastCaptureAttempt,
      gatewayResponse: payment.gatewayResponse,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    }));

    res.json({
      success: true,
      failedPayments: formattedPayments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Get failed payments error:", error);
    res.json({ success: false, message: error.message });
  }
};

/**
 * Retry failed payment (admin action)
 */
export const retryFailedPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const paymentDetails = await paymentDetailsModel.findById(paymentId);
    if (!paymentDetails) {
      return res.json({
        success: false,
        message: "Payment details not found"
      });
    }

    if (paymentDetails.gatewayStatus !== "failed") {
      return res.json({
        success: false,
        message: "Payment is not in failed status"
      });
    }

    // Reset payment status for retry
    paymentDetails.gatewayStatus = "pending";
    paymentDetails.captureAttempts = 0;
    paymentDetails.lastCaptureAttempt = null;
    paymentDetails.gatewayResponse = null;
    
    await paymentDetails.save();

    res.json({
      success: true,
      message: "Payment reset for retry",
      paymentDetails: {
        id: paymentDetails._id,
        status: paymentDetails.gatewayStatus,
        orderId: paymentDetails.orderId,
      }
    });
  } catch (error) {
    console.error("Retry failed payment error:", error);
    res.json({ success: false, message: error.message });
  }
};
