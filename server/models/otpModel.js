import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  otpHash: String,
  type: String, // 'register', 'resetPassword', 'unlockAccount'
  createdAt: { type: Date, default: Date.now, expires: 300 }, // Expires after 5 minutes (300 seconds)
});

const otpModel = mongoose.models.otp || mongoose.model("otp", otpSchema);

export default otpModel;
