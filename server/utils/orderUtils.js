import ghnService from "../services/ghnService.js";
import { sendOtpEmail } from "../services/emaiService.js";
import userModel from "../models/userModel.js";

// Create GHN order
export const createGhnOrder = async (order) => {
  if (!order.address.districtId || !order.address.wardCode) {
    console.warn("Cannot create GHN order: Missing address fields");
    return { success: false, message: "Missing address fields" };
  }

  const totalWeight = order.items.reduce(
    (total, item) => total + (item.weight || 500) * item.quantity,
    0
  );

  const ghnOrderData = {
    to_name: order.address.name || "Khách hàng",
    to_phone: order.address.phone,
    to_address: order.address.street,
    to_ward_code: order.address.wardCode,
    to_district_id: order.address.districtId,
    weight: totalWeight,
    length: 20,
    width: 20,
    height: 10,
    service_type_id: 2,
    payment_type_id: order.paymentMethod === "cod" ? 2 : 1,
    cod_amount: order.paymentMethod === "cod" ? order.amount : 0,
    note: `Đơn hàng #${order._id}`,
    required_note: "KHONGCHOXEMHANG",
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      weight: item.weight || 500,
    })),
  };

  const ghnResult = await ghnService.createOrder(ghnOrderData);
  if (ghnResult.success) {
    console.log("GHN Create Successful", ghnResult.data);
    order.ghnOrderCode = ghnResult.data.order_code;
    order.ghnExpectedDeliveryTime = new Date(ghnResult.data.expected_delivery_time);
    await order.save();
    return { success: true, ghnOrderCode: ghnResult.data.order_code };
  } else {
    console.error("GHN creation failed:", ghnResult.message);
    return { success: false, message: ghnResult.message };
  }
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (order) => {
  const user = await userModel.findById(order.userId);
  if (user) {
    const emailSubject = `Đơn hàng #${order._id} đã được xác nhận`;
    await sendOtpEmail(
      user.email,
      null,
      emailSubject,
      "order_status_update",
      {
        orderId: order._id,
        status: "confirmed",
        items: order.items,
        amount: order.amount,
        shippingFee: order.shippingFee,
        address: order.address,
        ghnOrderCode: order.ghnOrderCode,
        ghnExpectedDeliveryTime: order.ghnExpectedDeliveryTime,
      }
    );
    return true;
  }
  return false;
};