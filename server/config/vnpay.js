import dotenv from "dotenv";
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env.development";
dotenv.config({ path: envFile });
dotenv.config();

const VNPAY_CONFIG = {
  tmnCode: process.env.VNPAY_TMN_CODE || "",
  secureSecret: process.env.VNPAY_HASH_SECRET || "",
  vnpayHost: process.env.VNPAY_HOST || "https://sandbox.vnpayment.vn",
  paymentEndpoint: process.env.VNPAY_PAYMENT_ENDPOINT || "paymentv2/vpcpay.html",
  returnUrl: process.env.VNPAY_RETURN_URL || "",
  ipnUrl:
    process.env.VNPAY_IPN_URL || `${process.env.SERVER_URL}/api/payment/vnpay/ipn`,
  locale: process.env.VNPAY_LOCALE || "vn",
  currCode: "VND",
};

export default VNPAY_CONFIG;


