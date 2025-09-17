# Payment System Migration Guide

## Tổng quan

Hệ thống thanh toán đã được refactor để tách riêng PayPal fields thành collection `PaymentDetails` riêng biệt, hỗ trợ mở rộng cho nhiều payment gateway (VNPay, Stripe).

## Các thay đổi chính

### 1. Cache tỷ giá 
- **Trước**: Cache 10 phút
- **Sau**: Cache 1 giờ trong `currencyService.js`

### 2. Payment Data Structure
- **Trước**: PayPal fields embedded trong `orderModel`
- **Sau**: Tách riêng thành `paymentDetailsModel`

### 3. Hiển thị tiền tệ
- **Trước**: Hiển thị cả VND và USD
- **Sau**: Luôn hiển thị VND cho admin & client, USD chỉ dùng internal cho PayPal

## Migration Steps

### Bước 1: Backup Database
```bash
# Backup MongoDB
mongodump --uri="your_mongodb_uri" --out ./backup_before_migration
```

### Bước 2: Deploy New Code
```bash
# Deploy server với code mới
npm run deploy
```

### Bước 3: Run Migration Script
```bash
# Chạy migration để di chuyển dữ liệu PayPal
cd server
node scripts/migratePaymentData.js
```

### Bước 4: Verify Migration
```bash
# Kiểm tra collection mới
# Vào MongoDB và check:
# - paymentdetails collection có data
# - orders collection đã remove PayPal fields
# - hasPaymentDetails = true cho orders đã migrate
```

## New API Endpoints

### Admin Payment Management
```
GET /api/admin/payments                    # Get all payments (VND display)
GET /api/admin/payments/stats              # Payment statistics  
GET /api/admin/payments/failed             # Failed payments
GET /api/admin/payments/order/:orderId     # Payment by order ID
POST /api/admin/payments/retry/:paymentId  # Retry failed payment
```

## File Changes

### New Files
- `server/models/paymentDetailsModel.js` - Payment details schema
- `server/services/paymentService.js` - Payment business logic
- `server/controllers/adminPaymentController.mjs` - Admin payment APIs
- `server/routes/adminPaymentRoute.mjs` - Admin payment routes
- `server/scripts/migratePaymentData.js` - Migration script

### Modified Files
- `server/models/orderModel.js` - Removed PayPal fields
- `server/services/currencyService.js` - Cache 1 hour
- `server/controllers/paymentController.js` - Use new payment service
- `client/src/utils/currency.js` - VND display functions

## Rollback Plan

Nếu có vấn đề, rollback theo thứ tự:

1. **Revert Code**
```bash
git revert <commit_hash>
npm run deploy
```

2. **Restore Database**
```bash
mongorestore --uri="your_mongodb_uri" ./backup_before_migration
```

## Testing Checklist

### PayPal Integration
- [ ] PayPal order creation với VND → USD conversion
- [ ] PayPal payment capture 
- [ ] Webhook handling
- [ ] Error handling và retry logic

### Admin Panel
- [ ] Payment list hiển thị VND
- [ ] Payment statistics
- [ ] Failed payment management
- [ ] Export functionality

### Client Display
- [ ] Cart hiển thị VND
- [ ] Checkout hiển thị VND  
- [ ] Order history hiển thị VND
- [ ] PayPal button conversion info

## Performance Notes

- Cache tỷ giá 1 giờ giảm API calls
- Payment details collection có indexes tối ưu
- Admin queries sử dụng pagination
- Webhooks xử lý async

## Future Extensions

Cấu trúc mới hỗ trợ dễ dàng thêm:
- VNPay integration (`vnpay` fields)
- Stripe integration (`stripe` fields) 
- Crypto payments
- Bank transfers

## Support

Nếu có vấn đề trong migration:
1. Check migration logs
2. Verify database state
3. Test core payment flows
4. Contact dev team nếu cần rollback
