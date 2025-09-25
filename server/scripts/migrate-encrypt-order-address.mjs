import mongoose from "mongoose";
import dotenv from "dotenv";
import orderModel from "../models/orderModel.js";
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

async function run() {
  if (!connectString) {
    console.error("Missing MONGO_URI");
    process.exit(1);
  }

  await mongoose.connect(connectString);
  console.log("Connected to MongoDB");

  const cursor = orderModel.find({}).cursor();
  let processed = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const addr = doc.address || {};
    const nextAddr = { ...addr };

    // Only string fields should be encrypted
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
    // numeric/string IDs left as-is except wardCode which is string
    nextAddr.wardCode = addr.wardCode;
    nextAddr.provinceId = addr.provinceId;
    nextAddr.districtId = addr.districtId;

    // Assign and save with minimal writes
    doc.set("address", nextAddr);
    try {
      await doc.save({ validateBeforeSave: false });
      processed += 1;
      if (processed % 100 === 0) console.log(`Processed ${processed} orders...`);
    } catch (e) {
      console.error(`Failed to update order ${doc._id}:`, e.message);
    }
  }

  console.log(`Done. Processed ${processed} orders.`);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});


