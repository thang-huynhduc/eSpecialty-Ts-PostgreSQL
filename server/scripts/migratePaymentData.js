/**
 * Migration script to move PayPal specific data from orderModel to paymentDetailsModel
 * Run this once after deploying the new payment system
 */

import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";
import paymentDetailsModel from "../models/paymentDetailsModel.js";
import "dotenv/config";

const migratePaymentData = async () => {
  try {
    console.log("🚀 Starting payment data migration...");
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all orders with PayPal data
    const ordersWithPayPal = await orderModel.find({
      $or: [
        { paypalOrderId: { $exists: true, $ne: null } },
        { paypalCaptureId: { $exists: true, $ne: null } },
        { originalCurrency: { $exists: true } },
        { originalAmount: { $exists: true } },
        { exchangeRate: { $exists: true } }
      ]
    });

    console.log(`📊 Found ${ordersWithPayPal.length} orders with PayPal data`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of ordersWithPayPal) {
      try {
        // Check if payment details already exist
        const existingPaymentDetails = await paymentDetailsModel.findOne({
          orderId: order._id,
          paymentMethod: "paypal"
        });

        if (existingPaymentDetails) {
          console.log(`⏭️  Skipping order ${order._id} - payment details already exist`);
          skipped++;
          continue;
        }

        // Only migrate if there's actual PayPal data
        if (!order.paypalOrderId && !order.paypalCaptureId) {
          console.log(`⏭️  Skipping order ${order._id} - no PayPal IDs found`);
          skipped++;
          continue;
        }

        // Create payment details entry
        const paymentDetails = new paymentDetailsModel({
          orderId: order._id,
          paymentMethod: "paypal",
          originalCurrency: order.originalCurrency || "VND",
          originalAmount: order.originalAmount || order.amount,
          processedCurrency: order.originalCurrency === "VND" ? "USD" : order.originalCurrency,
          processedAmount: order.originalCurrency === "VND" ? null : order.amount, // Will be calculated
          exchangeRate: order.exchangeRate || null,
          
          paypal: {
            orderId: order.paypalOrderId || null,
            captureId: order.paypalCaptureId || null,
          },
          
          gatewayStatus: order.paymentStatus === "paid" ? "completed" : 
                        order.paymentStatus === "failed" ? "failed" : "pending",
          
          transactionId: order.paypalCaptureId || order.paypalOrderId || null,
          
          captureAttempts: order.captureAttempts || 0,
          lastCaptureAttempt: order.lastCaptureAttempt || null,
          
          createdAt: order.date || order.createdAt || new Date(),
          updatedAt: order.updatedAt || new Date(),
        });

        await paymentDetails.save();

        // Update order to mark it has payment details
        await orderModel.findByIdAndUpdate(order._id, {
          hasPaymentDetails: true,
          // Keep the original amount in VND for display
          amount: order.originalAmount || order.amount,
          $unset: {
            // Remove PayPal specific fields from order
            paypalOrderId: 1,
            paypalCaptureId: 1,
            originalCurrency: 1,
            originalAmount: 1,
            exchangeRate: 1,
            captureAttempts: 1,
            lastCaptureAttempt: 1,
          }
        });

        console.log(`✅ Migrated order ${order._id}`);
        migrated++;
      } catch (error) {
        console.error(`❌ Error migrating order ${order._id}:`, error.message);
        errors++;
      }
    }

    console.log("\n📈 Migration Summary:");
    console.log(`✅ Successfully migrated: ${migrated} orders`);
    console.log(`⏭️  Skipped: ${skipped} orders`);
    console.log(`❌ Errors: ${errors} orders`);
    console.log("🎉 Migration completed!");

  } catch (error) {
    console.error("💥 Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migratePaymentData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migratePaymentData;
