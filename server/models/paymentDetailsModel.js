import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.js";

// Transparent encrypt/decrypt string fields
const encryptStringSetter = (value) => {
  if (value === undefined || value === null) return value;
  try {
    // If value already a encrypted JSON string, keep it
    if (typeof value === "string" && value.includes("\"iv\"") && value.includes("\"content\"") && value.includes("\"tag\"")) {
      JSON.parse(value); 
      return value;
    }
  } catch (_) {}
  try {
    const payload = encrypt(value);
    return JSON.stringify(payload);
  } catch (_) {
    return value;
  }
};

const decryptStringGetter = (value) => {
  if (!value) return value;
  try {
    if (typeof value === "string") {
      const obj = JSON.parse(value);
      if (obj && obj.iv && obj.content && obj.tag) {
        return decrypt(obj);
      }
    }
  } catch (_) {}
  return value;
};

// Encrypt/decrypt for Mixed types (gatewayResponse)
const encryptMixedSetter = (value) => {
  if (value === undefined || value === null) return value;
  try {
    // If value already encrypted, keep it
    if (typeof value === "string" && value.includes("\"iv\"") && value.includes("\"content\"") && value.includes("\"tag\"")) {
      JSON.parse(value);
      return value;
    }
  } catch (_) {}
  try {
    const jsonString = JSON.stringify(value);
    const payload = encrypt(jsonString);
    return JSON.stringify(payload);
  } catch (_) {
    return value;
  }
};

const decryptMixedGetter = (value) => {
  if (!value) return value;
  try {
    if (typeof value === "string") {
      const obj = JSON.parse(value);
      if (obj && obj.iv && obj.content && obj.tag) {
        const decrypted = decrypt(obj);
        return JSON.parse(decrypted);
      }
    }
  } catch (_) {}
  return value;
};

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
    set: encryptStringSetter,
    get: decryptStringGetter,
  },
  // Payment status specific to the gateway
  gatewayStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "refunded"],
    default: "pending",
  },

  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    set: encryptMixedSetter,
    get: decryptMixedGetter,
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
  // Total order amount including shipping (for refund tracking)
  orderTotalAmount: {
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
      set: encryptMixedSetter,
      get: decryptMixedGetter,
    },
  },
  
  // VNPay specific fields 
  vnpay: {
    txnRef: {
      type: String,
      default: null,
      set: encryptStringSetter,
      get: decryptStringGetter,
    },
    vnpayTranId: {
      type: String,
      default: null,
      set: encryptStringSetter,
      get: decryptStringGetter,
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
      set: encryptStringSetter,
      get: decryptStringGetter,
    },
    chargeId: {
      type: String,
      default: null,
      set: encryptStringSetter,
      get: decryptStringGetter,
    },
    customerId: {
      type: String,
      default: null,
      set: encryptStringSetter,
      get: decryptStringGetter,
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
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true },
});

// Indexes for better query performance (only non-encrypted fields)
paymentDetailsSchema.index({ orderId: 1, paymentMethod: 1 });
paymentDetailsSchema.index({ "paypal.orderId": 1 });
paymentDetailsSchema.index({ "paypal.captureId": 1 });
// Note: Removed indexes for encrypted fields (txnRef, paymentIntentId) as they won't be searchable

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
