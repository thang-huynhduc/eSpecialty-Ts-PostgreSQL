# PayPal Integration Setup Guide

## Environment Variables Configuration

### Server Environment Variables (.env)

Add the following variables to your server `.env` file:

```bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
PAYPAL_WEBHOOK_SECRET=your_paypal_webhook_secret

# Client URL for redirects
CLIENT_URL=http://localhost:3000
```

### Client Environment Variables (.env)

Add the following variables to your client `.env` file:

```bash
# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

## PayPal Sandbox Setup

1. **Create PayPal Developer Account**
   - Go to [PayPal Developer Portal](https://developer.paypal.com)
   - Sign in with your PayPal account or create a new one

2. **Create Sandbox Application**
   - Navigate to "My Apps & Credentials"
   - Click "Create App"
   - Choose "Sandbox" environment
   - Select "Merchant" account type
   - Note down the Client ID and Client Secret

3. **Configure Webhook**
   - In your PayPal app settings, go to "Webhooks"
   - Add webhook URL: `http://your-domain.com/api/payment/paypal/webhook`
   - Select these events:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `PAYMENT.CAPTURE.PENDING`
     - `PAYMENT.CAPTURE.REFUNDED`
     - `PAYMENT.CAPTURE.REVERSED`
     - `CHECKOUT.ORDER.APPROVED`
     - `CHECKOUT.ORDER.COMPLETED`

## API Endpoints

### PayPal Order Creation
- **POST** `/api/payment/paypal/create-order`
- **Auth Required**: Yes
- **Body**: 
  ```json
  {
    "orderId": "your_order_id",
    "currency": "VND"
  }
  ```

### PayPal Payment Capture
- **POST** `/api/payment/paypal/capture-payment`
- **Auth Required**: Yes
- **Body**: 
  ```json
  {
    "paypalOrderId": "paypal_order_id",
    "orderId": "your_order_id"
  }
  ```

### PayPal Webhook
- **POST** `/api/payment/paypal/webhook`
- **Auth Required**: No (webhook signature verification)

## Currency Conversion

The system automatically converts VND to USD for PayPal payments:

- **Exchange Rate Source**: ExchangeRate-API (free tier)
- **Fallback Rate**: 1 VND = 0.000041 USD (~24,400 VND = 1 USD)
- **Cache Duration**: 10 minutes
- **Retry Logic**: 3 attempts with exponential backoff

## Error Handling

### Currency Conversion Failures
- Retries with exponential backoff
- Falls back to cached rates
- Uses hardcoded fallback rate as last resort
- Clear error messages to users

### PayPal Service Unavailable
- Graceful error handling
- User-friendly error messages
- Order remains in pending state
- Users can retry payment later

### Double Capture Prevention
- Idempotency checks
- Rate limiting (3 attempts per minute)
- Database-level validation

## Testing

### Test Credit Cards (PayPal Sandbox)
- **Visa**: 4111111111111111
- **Mastercard**: 5555555555554444
- **Amex**: 378282246310005

### Test Scenarios
1. **Successful Payment**: Complete the PayPal flow
2. **Cancelled Payment**: Cancel during PayPal checkout
3. **Failed Payment**: Use invalid payment method
4. **Currency Conversion**: Test VND to USD conversion
5. **Webhook Processing**: Verify webhook event handling

## Monitoring and Logging

- All PayPal operations are logged with audit trails
- Exchange rate failures are logged for debugging
- Webhook events are logged with timestamps
- Failed payment attempts are tracked

## Security Considerations

- PayPal Client Secret is server-side only
- Webhook signature verification implemented
- Rate limiting on capture attempts
- Input validation on all endpoints

## Production Deployment

1. Switch to PayPal Production environment
2. Update environment variables with production credentials
3. Configure production webhook URLs
4. Test thoroughly with real PayPal accounts
5. Monitor exchange rate API usage limits

## Troubleshooting

### Common Issues

1. **"Currency not supported by PayPal"**
   - Ensure currency code is in the supported list
   - VND is automatically converted to USD

2. **"PayPal service is currently unavailable"**
   - Check PayPal API status
   - Verify network connectivity
   - Check environment variables

3. **Webhook signature verification failed**
   - Verify webhook secret in environment variables
   - Check webhook URL configuration in PayPal

4. **Exchange rate conversion failed**
   - Check ExchangeRate-API status
   - Verify internet connectivity
   - System will use fallback rates
