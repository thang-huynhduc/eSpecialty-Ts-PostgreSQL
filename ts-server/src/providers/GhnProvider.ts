import { Ghn } from 'giaohangnhanh'
import { env } from '../config/environment.js'

export const ghn = new Ghn({
  token: env.GHN_API_TOKEN as string, // Thay bằng token của bạn
  shopId: Number(env.GHN_SHOP_ID), // Thay bằng shopId của bạn
  host: 'https://dev-online-gateway.ghn.vn',
  trackingHost: 'https://tracking.ghn.dev/',
  testMode: true // Bật chế độ test sẽ ghi đè tất cả host thành môi trường sandbox
})
