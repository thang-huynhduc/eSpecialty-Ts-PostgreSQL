import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.mjs';
import orderModel from '../models/orderModel.js';
import { convertVNDToUSD } from '../services/currencyService.js';

// Mock external dependencies
jest.mock('../services/currencyService.js');
jest.mock('@paypal/paypal-server-sdk');

describe('PayPal Integration Tests', () => {
  let testOrder;
  let authToken;

  beforeEach(async () => {
    // Setup test data
    testOrder = {
      _id: 'test_order_id',
      userId: 'test_user_id',
      amount: 1000000, // 1,000,000 VND
      items: [
        {
          productId: 'product_1',
          name: 'Test Product',
          price: 500000,
          quantity: 2,
          image: 'test_image.jpg'
        }
      ],
      address: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        street: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        zipcode: '12345',
        country: 'Vietnam',
        phone: '+84123456789'
      },
      paymentStatus: 'pending',
      paymentMethod: 'cod'
    };

    // Mock authentication token
    authToken = 'mock_jwt_token';
  });

  describe('POST /api/payment/paypal/create-order', () => {
    it('should create PayPal order successfully', async () => {
      // Mock currency conversion
      convertVNDToUSD.mockResolvedValue({
        success: true,
        usdAmount: 41.67,
        exchangeRate: 0.0000417,
        originalAmount: 1000000
      });

      // Mock PayPal SDK response
      const mockPayPalResponse = {
        statusCode: 201,
        result: {
          id: 'paypal_order_123',
          links: [
            {
              rel: 'approve',
              href: 'https://sandbox.paypal.com/approve?token=paypal_order_123'
            }
          ]
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder._id,
          currency: 'VND'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.paypalOrderId).toBe('paypal_order_123');
      expect(response.body.approveUrl).toContain('sandbox.paypal.com');
      expect(response.body.amount.vnd).toBe(1000000);
      expect(response.body.amount.usd).toBe(41.67);
    });

    it('should handle currency conversion failure', async () => {
      // Mock currency conversion failure
      convertVNDToUSD.mockResolvedValue({
        success: false,
        error: 'Currency conversion failed'
      });

      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder._id,
          currency: 'VND'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Currency conversion failed');
    });

    it('should reject unsupported currency', async () => {
      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder._id,
          currency: 'XYZ'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Currency not supported by PayPal');
    });

    it('should reject unauthorized requests', async () => {
      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .send({
          orderId: testOrder._id,
          currency: 'VND'
        });

      expect(response.status).toBe(401);
    });

    it('should reject already paid orders', async () => {
      // Mock order with paid status
      const paidOrder = { ...testOrder, paymentStatus: 'paid' };

      const response = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: paidOrder._id,
          currency: 'VND'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Order is already paid');
    });
  });

  describe('POST /api/payment/paypal/capture-payment', () => {
    it('should capture payment successfully', async () => {
      // Mock PayPal capture response
      const mockCaptureResponse = {
        statusCode: 201,
        result: {
          purchaseUnits: [{
            payments: {
              captures: [{
                id: 'capture_123',
                status: 'COMPLETED'
              }]
            }
          }]
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/capture-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paypalOrderId: 'paypal_order_123',
          orderId: testOrder._id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.captureId).toBe('capture_123');
    });

    it('should handle capture failure', async () => {
      // Mock PayPal capture failure
      const mockCaptureResponse = {
        statusCode: 422,
        result: {
          error: 'CAPTURE_FAILED'
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/capture-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paypalOrderId: 'paypal_order_123',
          orderId: testOrder._id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('capture failed');
    });

    it('should prevent double capture', async () => {
      // Mock order with existing capture
      const capturedOrder = { 
        ...testOrder, 
        paymentStatus: 'paid',
        paypalCaptureId: 'existing_capture_123'
      };

      const response = await request(app)
        .post('/api/payment/paypal/capture-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paypalOrderId: 'paypal_order_123',
          orderId: capturedOrder._id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Payment already captured');
      expect(response.body.alreadyCaptured).toBe(true);
    });

    it('should rate limit capture attempts', async () => {
      // Mock order with recent failed attempts
      const rateLimitedOrder = {
        ...testOrder,
        captureAttempts: 3,
        lastCaptureAttempt: new Date(Date.now() - 30000) // 30 seconds ago
      };

      const response = await request(app)
        .post('/api/payment/paypal/capture-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paypalOrderId: 'paypal_order_123',
          orderId: rateLimitedOrder._id
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Too many capture attempts');
    });
  });

  describe('POST /api/payment/paypal/webhook', () => {
    it('should handle payment capture completed webhook', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'capture_123',
          status: 'COMPLETED'
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/webhook')
        .set('paypal-transmission-signature', 'valid_signature')
        .set('paypal-transmission-id', 'webhook_id')
        .set('paypal-transmission-time', new Date().toISOString())
        .set('paypal-cert-id', 'cert_id')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle payment capture denied webhook', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.DENIED',
        resource: {
          id: 'capture_123'
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/webhook')
        .set('paypal-transmission-signature', 'valid_signature')
        .set('paypal-transmission-id', 'webhook_id')
        .set('paypal-transmission-time', new Date().toISOString())
        .set('paypal-cert-id', 'cert_id')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle payment refund webhook', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.REFUNDED',
        resource: {
          id: 'capture_123'
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/webhook')
        .set('paypal-transmission-signature', 'valid_signature')
        .set('paypal-transmission-id', 'webhook_id')
        .set('paypal-transmission-time', new Date().toISOString())
        .set('paypal-cert-id', 'cert_id')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookPayload = {
        event_type: 'PAYMENT.CAPTURE.COMPLETED',
        resource: {
          id: 'capture_123'
        }
      };

      const response = await request(app)
        .post('/api/payment/paypal/webhook')
        .set('paypal-transmission-signature', 'invalid_signature')
        .send(webhookPayload);

      expect(response.status).toBe(401);
    });

    it('should ignore unsupported event types', async () => {
      const webhookPayload = {
        event_type: 'UNSUPPORTED.EVENT',
        resource: {}
      };

      const response = await request(app)
        .post('/api/payment/paypal/webhook')
        .set('paypal-transmission-signature', 'valid_signature')
        .set('paypal-transmission-id', 'webhook_id')
        .set('paypal-transmission-time', new Date().toISOString())
        .set('paypal-cert-id', 'cert_id')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });

  describe('Currency Service Tests', () => {
    it('should convert VND to USD successfully', async () => {
      const result = await convertVNDToUSD(1000000);
      
      expect(result.success).toBe(true);
      expect(result.usdAmount).toBeGreaterThan(0);
      expect(result.exchangeRate).toBeGreaterThan(0);
      expect(result.originalAmount).toBe(1000000);
    });

    it('should handle invalid VND amount', async () => {
      const result = await convertVNDToUSD(-100);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid VND amount');
    });

    it('should handle amount below PayPal minimum', async () => {
      const result = await convertVNDToUSD(1000); // Very small amount
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('below PayPal\'s minimum');
    });
  });

  describe('Integration Tests', () => {
    it('should complete full PayPal payment flow', async () => {
      // 1. Create PayPal order
      const createResponse = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder._id,
          currency: 'VND'
        });

      expect(createResponse.body.success).toBe(true);
      const paypalOrderId = createResponse.body.paypalOrderId;

      // 2. Capture payment
      const captureResponse = await request(app)
        .post('/api/payment/paypal/capture-payment')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paypalOrderId,
          orderId: testOrder._id
        });

      expect(captureResponse.body.success).toBe(true);
      expect(captureResponse.body.captureId).toBeDefined();

      // 3. Verify order status updated
      const order = await orderModel.findById(testOrder._id);
      expect(order.paymentStatus).toBe('paid');
      expect(order.status).toBe('confirmed');
      expect(order.paypalCaptureId).toBeDefined();
    });

    it('should handle cancelled PayPal payment', async () => {
      // 1. Create PayPal order
      const createResponse = await request(app)
        .post('/api/payment/paypal/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          orderId: testOrder._id,
          currency: 'VND'
        });

      expect(createResponse.body.success).toBe(true);

      // 2. User cancels - no capture call made
      // 3. Order should remain in pending state
      const order = await orderModel.findById(testOrder._id);
      expect(order.paymentStatus).toBe('pending');
    });
  });
});
