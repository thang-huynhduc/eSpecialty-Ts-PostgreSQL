import mongoose from "mongoose";

const paymentDetailsSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "order",
    required: true,
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ["paypal", "vnpay", "stripe", "cod"],
    required: true,
  },
  // Generic transaction ID for all payment gateways
  transactionId: {
    type: String,
    required: false,
    index: true,
  },
  // Payment status specific to the gateway
  gatewayStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "refunded"],
    default: "pending",
  },
  // Raw response from payment gateway (for debugging and audit)
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Currency information
  originalCurrency: {
    type: String,
    default: "VND",
  },
  originalAmount: {
    type: Number,
    required: true,
  },
  processedCurrency: {
    type: String,
    default: null, // USD for PayPal, VND for VNPay
  },
  processedAmount: {
    type: Number,
    default: null, // Converted amount for payment
  },
  exchangeRate: {
    type: Number,
    default: null,
  },
  
  // PayPal specific fields
  paypal: {
    orderId: {
      type: String,
      default: null,
    },
    captureId: {
      type: String,
      default: null,
    },
    payerInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  
  // VNPay specific fields (for future implementation)
  vnpay: {
    txnRef: {
      type: String,
      default: null,
    },
    vnpayTranId: {
      type: String,
      default: null,
    },
    bankCode: {
      type: String,
      default: null,
    },
    responseCode: {
      type: String,
      default: null,
    },
  },
  
  // Stripe specific fields (for future implementation)
  stripe: {
    paymentIntentId: {
      type: String,
      default: null,
    },
    chargeId: {
      type: String,
      default: null,
    },
    customerId: {
      type: String,
      default: null,
    },
  },
  
  // Audit fields
  captureAttempts: {
    type: Number,
    default: 0,
  },
  lastCaptureAttempt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
paymentDetailsSchema.index({ orderId: 1, paymentMethod: 1 });
paymentDetailsSchema.index({ "paypal.orderId": 1 });
paymentDetailsSchema.index({ "paypal.captureId": 1 });
paymentDetailsSchema.index({ "vnpay.txnRef": 1 });
paymentDetailsSchema.index({ "stripe.paymentIntentId": 1 });

// Update timestamp on save
paymentDetailsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual field for easy access to gateway-specific data
paymentDetailsSchema.virtual('gatewayData').get(function() {
  switch(this.paymentMethod) {
    case 'paypal':
      return this.paypal;
    case 'vnpay':
      return this.vnpay;
    case 'stripe':
      return this.stripe;
    default:
      return null;
  }
});

// Static method to find by payment method and gateway ID
paymentDetailsSchema.statics.findByGatewayId = function(paymentMethod, gatewayId) {
  const query = {};
  
  switch(paymentMethod) {
    case 'paypal':
      query['paypal.orderId'] = gatewayId;
      break;
    case 'vnpay':
      query['vnpay.txnRef'] = gatewayId;
      break;
    case 'stripe':
      query['stripe.paymentIntentId'] = gatewayId;
      break;
    default:
      return null;
  }
  
  return this.findOne(query);
};

const paymentDetailsModel =
  mongoose.models.paymentDetails || mongoose.model("paymentDetails", paymentDetailsSchema);

export default paymentDetailsModel;
