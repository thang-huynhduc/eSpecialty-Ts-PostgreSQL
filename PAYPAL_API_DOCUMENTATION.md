# PayPal Integration API Documentation

## Overview

This API provides PayPal payment integration for the eSpecialty e-commerce platform with automatic VND to USD currency conversion.

## Base URL
```
Development: http://localhost:8000
Production: https://your-domain.com
```

## Authentication

All payment endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create PayPal Order

Creates a PayPal order with automatic currency conversion from VND to USD.

**Endpoint:** `POST /api/payment/paypal/create-order`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "orderId": "64f1234567890abcdef12345",
  "currency": "VND"
}
```

**Parameters:**
- `orderId` (string, required): The internal order ID from your database
- `currency` (string, optional): Currency code, defaults to "VND"

**Success Response (200):**
```json
{
  "success": true,
  "paypalOrderId": "7XL12345RP123456L",
  "approveUrl": "https://sandbox.paypal.com/checkoutnow?token=7XL12345RP123456L",
  "amount": {
    "vnd": 1000000,
    "usd": 41.67
  },
  "exchangeRate": 0.0000417,
  "message": "PayPal order created successfully"
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Order not found"
}
```

```json
{
  "success": false,
  "message": "Currency not supported by PayPal"
}
```

```json
{
  "success": false,
  "message": "Order is already paid"
}
```

```json
{
  "success": false,
  "message": "Currency conversion failed. Please try again later or switch to USD."
}
```

### 2. Capture PayPal Payment

Captures the payment after user approval on PayPal.

**Endpoint:** `POST /api/payment/paypal/capture-payment`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "paypalOrderId": "7XL12345RP123456L",
  "orderId": "64f1234567890abcdef12345"
}
```

**Parameters:**
- `paypalOrderId` (string, required): PayPal order ID returned from create-order
- `orderId` (string, required): Internal order ID

**Success Response (200):**
```json
{
  "success": true,
  "message": "Payment captured successfully",
  "order": {
    "_id": "64f1234567890abcdef12345",
    "paymentStatus": "paid",
    "status": "confirmed",
    "paypalCaptureId": "1AB23456CD789012E"
  },
  "captureId": "1AB23456CD789012E"
}
```

**Idempotent Response (200):**
```json
{
  "success": true,
  "message": "Payment already captured",
  "order": {
    "_id": "64f1234567890abcdef12345",
    "paymentStatus": "paid"
  },
  "alreadyCaptured": true
}
```

**Error Responses:**
```json
{
  "success": false,
  "message": "Order not found"
}
```

```json
{
  "success": false,
  "message": "PayPal order ID mismatch"
}
```

```json
{
  "success": false,
  "message": "Too many capture attempts. Please wait before trying again."
}
```

```json
{
  "success": false,
  "message": "Payment capture was not completed"
}
```

### 3. PayPal Webhook Handler

Handles PayPal webhook events for payment status updates.

**Endpoint:** `POST /api/payment/paypal/webhook`

**Headers:**
```
Content-Type: application/json
paypal-transmission-signature: <signature>
paypal-transmission-id: <webhook_id>
paypal-transmission-time: <timestamp>
paypal-cert-id: <cert_id>
```

**Supported Events:**
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.PENDING`
- `PAYMENT.CAPTURE.REFUNDED`
- `PAYMENT.CAPTURE.REVERSED`
- `CHECKOUT.ORDER.APPROVED`
- `CHECKOUT.ORDER.COMPLETED`

**Example Webhook Payload:**
```json
{
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource": {
    "id": "1AB23456CD789012E",
    "status": "COMPLETED",
    "amount": {
      "currency_code": "USD",
      "value": "41.67"
    }
  }
}
```

**Response (200):**
```json
{
  "received": true
}
```

**Error Response (401):**
```
Unauthorized
```

## Currency Conversion

### Exchange Rate Service

The system uses real-time exchange rates with multiple fallback mechanisms:

1. **Primary**: ExchangeRate-API (free tier)
2. **Fallback**: Cached rates from successful requests
3. **Last Resort**: Hardcoded rate (1 VND = 0.000041 USD)

### Conversion Rules

- **Minimum Amount**: Converted USD amount must be ≥ $1.00
- **Precision**: USD amounts rounded to 2 decimal places
- **Cache**: Exchange rates cached for 10 minutes
- **Retry Logic**: 3 attempts with exponential backoff

## Error Handling

### HTTP Status Codes

- `200` - Success (even for business logic errors)
- `401` - Unauthorized (missing or invalid JWT)
- `422` - Unprocessable Entity (PayPal API errors)
- `500` - Internal Server Error

### Error Response Format

All errors follow this format:
```json
{
  "success": false,
  "message": "Human-readable error message"
}
```

### Common Error Scenarios

1. **Currency Conversion Failure**
   ```json
   {
     "success": false,
     "message": "We couldn't process your currency conversion right now. Please try again later or switch to USD."
   }
   ```

2. **PayPal Service Unavailable**
   ```json
   {
     "success": false,
     "message": "PayPal service is currently unavailable. We've saved your order as pending. Please try again in a few minutes."
   }
   ```

3. **Double Capture Prevention**
   ```json
   {
     "success": false,
     "message": "Too many capture attempts. Please wait before trying again."
   }
   ```

## Rate Limiting

### Capture Attempts
- **Limit**: 3 attempts per minute per order
- **Reset**: Counter resets after successful capture
- **Tracking**: Stored in database with timestamps

## Security

### Webhook Verification
- HMAC-SHA256 signature verification
- Timestamp validation
- Event type filtering

### Payment Security
- No client secrets exposed to frontend
- JWT-based authentication
- Order ownership validation
- Idempotency protection

## Database Schema Updates

### Order Model Extensions

```javascript
{
  // Existing fields...
  
  // PayPal specific fields
  paypalOrderId: String,           // PayPal order ID
  paypalCaptureId: String,         // PayPal capture ID
  
  // Currency information
  originalCurrency: String,        // Original currency (VND)
  originalAmount: Number,          // Original amount in VND
  exchangeRate: Number,           // VND to USD exchange rate
  
  // Idempotency protection
  captureAttempts: Number,        // Number of capture attempts
  lastCaptureAttempt: Date,       // Last capture attempt timestamp
  
  // Updated payment methods
  paymentMethod: {
    type: String,
    enum: ["cod", "stripe", "paypal", "vnpay"]
  }
}
```

## Frontend Integration

### PayPal JavaScript SDK

The frontend uses `@paypal/react-paypal-js` for PayPal button integration:

```jsx
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalPayment = ({ orderId, amount, onSuccess }) => {
  return (
    <PayPalScriptProvider options={{
      "client-id": "your-client-id",
      currency: "USD",
      intent: "capture"
    }}>
      <PayPalButtons
        createOrder={() => createPayPalOrderAPI(orderId)}
        onApprove={(data) => capturePayPalPaymentAPI(data.orderID, orderId)}
        onSuccess={onSuccess}
      />
    </PayPalScriptProvider>
  );
};
```

## Testing

### Test Environment
- **PayPal Sandbox**: Use sandbox credentials
- **Test Cards**: PayPal provides test payment methods
- **Webhook Testing**: Use ngrok or similar for local webhook testing

### Test Scenarios

1. **Successful Payment Flow**
   - Create order → Approve → Capture → Webhook confirmation

2. **Currency Conversion**
   - Various VND amounts
   - Edge cases (very small/large amounts)
   - API failures and fallbacks

3. **Error Scenarios**
   - Network failures
   - Invalid order states
   - Double capture attempts
   - Webhook signature validation

4. **Edge Cases**
   - Concurrent capture attempts
   - Order cancellation during flow
   - Partial captures
   - Refunds and disputes

## Monitoring

### Audit Logging

All PayPal operations are logged with:
- Timestamp
- User ID
- Order ID
- Operation type
- Success/failure status
- Error details

### Metrics to Monitor

- Currency conversion success rate
- PayPal API response times
- Payment completion rate
- Webhook processing latency
- Error frequency by type

## Deployment Checklist

### Environment Setup
- [ ] PayPal sandbox/production credentials configured
- [ ] Webhook URLs updated in PayPal dashboard
- [ ] Environment variables set correctly
- [ ] SSL certificates configured for webhooks

### Testing
- [ ] End-to-end payment flow tested
- [ ] Currency conversion tested
- [ ] Webhook events tested
- [ ] Error scenarios tested
- [ ] Rate limiting tested

### Monitoring
- [ ] Logging configured
- [ ] Error alerts set up
- [ ] Performance monitoring enabled
- [ ] Database backup verified
