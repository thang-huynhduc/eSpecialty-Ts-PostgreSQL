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

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      set: encryptStringSetter,
      get: decryptStringGetter,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      set: encryptStringSetter,
      get: decryptStringGetter,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      set: encryptStringSetter,
      get: decryptStringGetter,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["unread", "read", "replied"],
      default: "unread",
    },
    adminNotes: {
      type: String,
      trim: true,
      default: "",
      set: encryptStringSetter,
      get: decryptStringGetter,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Index for better query performance
contactSchema.index({ userId: 1 });
contactSchema.index({ status: 1 });
contactSchema.index({ createdAt: -1 });

export default mongoose.model("Contact", contactSchema);
