import { Client, Environment } from "@paypal/paypal-server-sdk";

// PayPal environment configuration
const environment = process.env.NODE_ENV === "production" 
  ? Environment.Production
  : Environment.Sandbox;

// PayPal client configuration
const paypalClient = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: process.env.PAYPAL_CLIENT_ID,
    oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  },
  environment: environment,
  loggingConfiguration: {
    logLevel: process.env.NODE_ENV === "production" ? "INFO" : "DEBUG",
    enableMasking: true,
  },
});

// PayPal webhook configuration
export const PAYPAL_WEBHOOK_CONFIG = {
  webhookId: process.env.PAYPAL_WEBHOOK_ID,
  webhookSecret: process.env.PAYPAL_WEBHOOK_SECRET,
};

// Supported PayPal events
export const SUPPORTED_PAYPAL_EVENTS = [
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.DENIED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.REFUNDED",
  "PAYMENT.CAPTURE.REVERSED",
  "CHECKOUT.ORDER.APPROVED",
  "CHECKOUT.ORDER.COMPLETED",
];

export default paypalClient;
