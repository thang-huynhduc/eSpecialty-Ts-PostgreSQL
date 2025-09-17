# Tích hợp Giao Hàng Nhanh (GHN)

## Cài đặt

### 1. Environment Variables
Thêm vào file `.env`:
```bash
GHN_TOKEN=your_ghn_token_here
GHN_SHOP_ID=your_shop_id_here
GHN_FROM_DISTRICT_ID=your_from_district_id_here
```

### 2. Package đã cài
- `giaohangnhanh` - SDK chính thức của GHN

## Tính năng đã triển khai

### 1. AddressSelector Component
- **Refactor hoàn toàn** từ provinces.open-api.vn sang GHN API
- Hỗ trợ tự động mapping dữ liệu cũ sang format GHN
- API endpoints: `/api/ghn/provinces`, `/api/ghn/districts/:id`, `/api/ghn/wards/:id`

### 2. Order Model
Thêm các field mới:
```javascript
shippingFee: Number
ghnOrderCode: String  
ghnStatus: String
ghnExpectedDeliveryTime: Date
provinceId: Number
districtId: Number
wardCode: String
```

### 3. Shipping Fee Calculator
- Tự động tính phí ship khi tạo đơn hàng
- API: `POST /api/shipping/calculate-fee`
- Dựa trên trọng lượng và địa chỉ giao hàng

### 4. GHN Order Integration  
- Tự động tạo đơn trên GHN cho đơn hàng online (không COD)
- Lưu mã vận đơn và thời gian dự kiến
- Webhook để cập nhật trạng thái real-time

### 5. Webhook Status Sync
- Endpoint: `POST /api/ghn/webhook`
- Tự động mapping trạng thái GHN → trạng thái đơn hàng
- Cập nhật thời gian dự kiến giao hàng

## API Endpoints

### GHN Routes (`/api/ghn/`)
- `GET /provinces` - Danh sách tỉnh/thành
- `GET /districts/:provinceId` - Danh sách quận/huyện  
- `GET /wards/:districtId` - Danh sách phường/xã
- `POST /calculate-fee` - Tính phí vận chuyển
- `GET /services/:from/:to` - Dịch vụ vận chuyển
- `POST /webhook` - Webhook cập nhật trạng thái

### Shipping Routes (`/api/shipping/`)
- `POST /calculate-fee` - Tính phí ship cho đơn hàng
- `GET /services/:from/:to` - Dịch vụ giao hàng

## Cách sử dụng

### 1. Frontend - AddressSelector
```jsx
<AddressSelector 
  onAddressChange={(data) => {
    // data chứa: provinceId, districtId, wardCode, names
  }}
  initialValues={{
    provinceName: "Hồ Chí Minh",
    districtName: "Quận 1", 
    wardName: "Phường Bến Nghé"
  }}
/>
```

### 2. Tính phí ship
```javascript
const response = await fetch('/api/shipping/calculate-fee', {
  method: 'POST',
  body: JSON.stringify({
    toDistrictId: 1442,
    toWardCode: "21211",
    items: cartItems
  })
});
```

### 3. Tạo đơn hàng với GHN
```javascript
const orderData = {
  items: cartItems,
  amount: totalAmount,
  address: {
    ...addressData,
    provinceId: 202,
    districtId: 1442, 
    wardCode: "21211"
  }
};
```

## Status Mapping

| GHN Status | Order Status |
|------------|-------------|
| ready_to_pick, picking | confirmed |
| picked, storing, transporting | shipped |
| delivered | delivered |
| return, cancelled | cancelled |
| delivery_fail, exception | pending |

## Sandbox Testing
- `testMode: true` khi `NODE_ENV !== 'production'`
- Sử dụng sandbox credentials của GHN

## Webhook Setup
Đăng ký webhook URL tại GHN: `https://yourdomain.com/api/ghn/webhook`
