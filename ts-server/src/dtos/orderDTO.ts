import { Decimal } from '@prisma/client/runtime/client'
import { PaymentMethod } from 'generated/prisma/enums.js'

// Item trong giỏ hàng gửi lên
export interface CartItemDTO {
  productId: string;
  quantity: number;
}

// Data tạo đơn
export interface CreateOrderDTO {
  items: CartItemDTO[];
  shippingAddress: any; // Object JSON địa chỉ
  paymentMethod: PaymentMethod;
  shippingFee?: number;
}

export interface OrderItemDTO {
  productId: string;
  quantity: number;
  price: Decimal;
  name: string;
  image: string;
  weight: number
}
