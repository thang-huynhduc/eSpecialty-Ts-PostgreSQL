import mongoose from "mongoose";
import dotenv from "dotenv";
import orderModel from "../models/orderModel.js";
import contactModel from "../models/contactModel.js";
import paymentDetailsModel from "../models/paymentDetailsModel.js";
import { encrypt } from "../utils/crypto.js";

const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });

const connectString = process.env.MONGO_URI;

const isEncryptedLike = (val) => {
  if (!val || typeof val !== "string") return false;
  try {
    if (val.includes("\"iv\"") && val.includes("\"content\"") && val.includes("\"tag\"")) {
      const obj = JSON.parse(val);
      return Boolean(obj && obj.iv && obj.content && obj.tag);
    }
  } catch (_) {}
  return false;
};

const encryptIfNeeded = (plain) => {
  if (plain === undefined || plain === null) return plain;
  if (typeof plain === "string" && isEncryptedLike(plain)) return plain;
  try {
    const payload = encrypt(plain);
    return JSON.stringify(payload);
  } catch (_) {
    return plain;
  }
};

const encryptMixedIfNeeded = (obj) => {
  if (obj === undefined || obj === null) return obj;
  if (typeof obj === "string" && isEncryptedLike(obj)) return obj;
  try {
    const jsonString = JSON.stringify(obj);
    const payload = encrypt(jsonString);
    return JSON.stringify(payload);
  } catch (_) {
    return obj;
  }
};

async function migrateOrders() {
  console.log("Starting Order migration...");
  const cursor = orderModel.find({}).cursor();
  let processed = 0;
  
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const addr = doc.address || {};
    const nextAddr = { ...addr };

    // Encrypt address string fields
    nextAddr.firstName = encryptIfNeeded(addr.firstName);
    nextAddr.lastName = encryptIfNeeded(addr.lastName);
    nextAddr.email = encryptIfNeeded(addr.email);
    nextAddr.street = encryptIfNeeded(addr.street);
    nextAddr.ward = encryptIfNeeded(addr.ward);
    nextAddr.district = encryptIfNeeded(addr.district);
    nextAddr.city = encryptIfNeeded(addr.city);
    nextAddr.zipcode = encryptIfNeeded(addr.zipcode);
    nextAddr.country = encryptIfNeeded(addr.country);
    nextAddr.phone = encryptIfNeeded(addr.phone);
    
    // Keep numeric/string IDs as-is
    nextAddr.wardCode = addr.wardCode;
    nextAddr.provinceId = addr.provinceId;
    nextAddr.districtId = addr.districtId;

    doc.set("address", nextAddr);
    try {
      await doc.save({ validateBeforeSave: false });
      processed += 1;
      if (processed % 100 === 0) console.log(`Processed ${processed} orders...`);
    } catch (e) {
      console.error(`Failed to update order ${doc._id}:`, e.message);
    }
  }
  
  console.log(`Order migration completed. Processed ${processed} orders.`);
  return processed;
}

async function migrateContacts() {
  console.log("Starting Contact migration...");
  const cursor = contactModel.find({}).cursor();
  let processed = 0;
  
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const updates = {};
    
    // Encrypt sensitive fields
    if (doc.name) updates.name = encryptIfNeeded(doc.name);
    if (doc.email) updates.email = encryptIfNeeded(doc.email);
    if (doc.message) updates.message = encryptIfNeeded(doc.message);
    if (doc.adminNotes) updates.adminNotes = encryptIfNeeded(doc.adminNotes);
    
    try {
      await contactModel.updateOne({ _id: doc._id }, { $set: updates });
      processed += 1;
      if (processed % 100 === 0) console.log(`Processed ${processed} contacts...`);
    } catch (e) {
      console.error(`Failed to update contact ${doc._id}:`, e.message);
    }
  }
  
  console.log(`Contact migration completed. Processed ${processed} contacts.`);
  return processed;
}

async function migratePaymentDetails() {
  console.log("Starting PaymentDetails migration...");
  const cursor = paymentDetailsModel.find({}).cursor();
  let processed = 0;
  
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const updates = {};
    
    // Encrypt string fields
    if (doc.transactionId) updates.transactionId = encryptIfNeeded(doc.transactionId);
    if (doc.gatewayResponse) updates.gatewayResponse = encryptMixedIfNeeded(doc.gatewayResponse);
    
    // Encrypt PayPal fields
    if (doc.paypal?.payerInfo) {
      updates["paypal.payerInfo"] = encryptMixedIfNeeded(doc.paypal.payerInfo);
    }
    
    // Encrypt VNPay fields
    if (doc.vnpay?.txnRef) updates["vnpay.txnRef"] = encryptIfNeeded(doc.vnpay.txnRef);
    if (doc.vnpay?.vnpayTranId) updates["vnpay.vnpayTranId"] = encryptIfNeeded(doc.vnpay.vnpayTranId);
    
    // Encrypt Stripe fields
    if (doc.stripe?.paymentIntentId) updates["stripe.paymentIntentId"] = encryptIfNeeded(doc.stripe.paymentIntentId);
    if (doc.stripe?.chargeId) updates["stripe.chargeId"] = encryptIfNeeded(doc.stripe.chargeId);
    if (doc.stripe?.customerId) updates["stripe.customerId"] = encryptIfNeeded(doc.stripe.customerId);
    
    try {
      await paymentDetailsModel.updateOne({ _id: doc._id }, { $set: updates });
      processed += 1;
      if (processed % 100 === 0) console.log(`Processed ${processed} payment details...`);
    } catch (e) {
      console.error(`Failed to update payment detail ${doc._id}:`, e.message);
    }
  }
  
  console.log(`PaymentDetails migration completed. Processed ${processed} payment details.`);
  return processed;
}

async function run() {
  if (!connectString) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(connectString);
  console.log("Connected to MongoDB");

  try {
    const startTime = Date.now();
    
    // Run all migrations
    const orderCount = await migrateOrders();
    const contactCount = await migrateContacts();
    const paymentCount = await migratePaymentDetails();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log("\n=== Migration Summary ===");
    console.log(`Orders processed: ${orderCount}`);
    console.log(`Contacts processed: ${contactCount}`);
    console.log(`Payment details processed: ${paymentCount}`);
    console.log(`Total time: ${duration.toFixed(2)} seconds`);
    console.log("All migrations completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
