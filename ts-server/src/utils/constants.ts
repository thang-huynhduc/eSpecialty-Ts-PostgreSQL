// Login
export const MAX_FAILED_ATTEMPTS = 5
export const LOCK_TIME = 15 * 60 * 1000 // Khóa 15 phút

// OTP
export const OTP_EXPIRATION_MINUTES = 30

// Những domain được phép truy cập tới tài nguyên của Server
export const WHITELIST_DOMAINS: string[] = [
  'http://localhost:3000', // Frontend NextJS/React
  'http://localhost:5174', // Frontend Admin Vite
  'http://localhost:5173' // FE Client Vite
]

// Map trạng thái GHN sang trạng thái DB của mình (Đưa ra ngoài function cho gọn)
export const GHN_STATUS_MAPPING: Record<string, string> = {
  'ready_to_pick': 'confirmed',
  'picking': 'confirmed',
  'money_collect_picking': 'confirmed',
  'picked': 'shipped',
  'storing': 'shipped',
  'transporting': 'shipped',
  'sorting': 'shipped',
  'delivering': 'shipped',
  'money_collect_delivering': 'shipped',
  'delivered': 'delivered',
  'delivery_fail': 'pending',
  'waiting_to_return': 'pending',
  'return': 'cancelled',
  'return_transporting': 'cancelled',
  'return_sorting': 'cancelled',
  'returning': 'cancelled',
  'return_fail': 'cancelled',
  'returned': 'cancelled',
  'exception': 'pending',
  'damage': 'cancelled',
  'lost': 'cancelled'
}
