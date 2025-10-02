import mongoose from "mongoose";
import { encrypt, decrypt } from "../utils/crypto.js";

// Transparentencrypt/decrypt string fields
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




const AddressSchema = new mongoose.Schema(
  { 
    name: { type: String, required: false, set: encryptStringSetter, get: decryptStringGetter },
    email: { type: String, required: true, set: encryptStringSetter, get: decryptStringGetter },
    street: { type: String, required: true, set: encryptStringSetter, get: decryptStringGetter },
    ward: { type: String, required: true, set: encryptStringSetter, get: decryptStringGetter },
    district: { type: String, required: true, set: encryptStringSetter, get: decryptStringGetter },
    city: { type: String, required: true, set: encryptStringSetter, get: decryptStringGetter },
    zipcode: { type: String, required: false, set: encryptStringSetter, get: decryptStringGetter },
    country: { type: String, required: true, default: "Vietnam", set: encryptStringSetter, get: decryptStringGetter },
    phone: { type: String, required: true, set: encryptStringSetter, get: decryptStringGetter },
    provinceId: { type: Number },
    districtId: { type: Number },
    wardCode: { type: String },
  },
  {
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);



const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      image: {
        type: String,
      },
      weight: { // Thêm trường weight
        type: Number,
        required: true,
        default: 500, // Mặc định 500g nếu không có giá trị
      },
    },
  ],
  amount: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  address: { type: AddressSchema, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  emailSent: { type: Boolean, default: false },
  paymentMethod: {
    type: String,
    enum: ["cod", "stripe", "paypal", "vnpay"],
    default: "cod",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded", "refund_pending"],
    default: "pending",
  },
  // Payment tracking
  hasPaymentDetails: {
    type: Boolean,
    default: false,
  },
  // Refund history
  refundHistory: [
    {
      refundId: String,
      refundAmount: {
        vnd: Number,
        usd: Number,
      },
      exchangeRate: Number,
      reason: String,
      refundedBy: {
        type: String,
        enum: ["admin", "customer"],
      },
      refundedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ["completed", "failed", "pending"],
        default: "completed",
      },
    },
  ],
  shippingFee: {
    type: Number,
    default: 0,
  },
  ghnOrderCode: {
    type: String,
  },
  ghnStatus: {
    type: String,
  },
  ghnExpectedDeliveryTime: {
    type: Date,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  // Ensure totalAmount stays consistent = amount + shippingFee
  const shipping = typeof this.shippingFee === "number" ? this.shippingFee : 0;
  const baseAmount = typeof this.amount === "number" ? this.amount : 0;
  this.totalAmount = baseAmount + shipping;
  next();
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;
