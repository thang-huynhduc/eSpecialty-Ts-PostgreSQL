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
    label: { type: String },
    street: { type: String, set: encryptStringSetter, get: decryptStringGetter },
    ward: { type: String, set: encryptStringSetter, get: decryptStringGetter },
    district: { type: String, set: encryptStringSetter, get: decryptStringGetter },
    city: { type: String, set: encryptStringSetter, get: decryptStringGetter },
    zipCode: { type: String, set: encryptStringSetter, get: decryptStringGetter },
    country: { type: String, default: "Vietnam" },
    phone: { type: String, default: "", set: encryptStringSetter, get: decryptStringGetter },
    isDefault: { type: Boolean, default: false },
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
  },
  {
    _id: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    userCart: {
      type: Object,
      default: {},
    }, 
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "order",
      },
    ],
    addresses: [AddressSchema],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    avatar: { type: String, default: "" },
  },
  {
    minimize: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Index for better query performance
userSchema.index({ role: 1 });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
