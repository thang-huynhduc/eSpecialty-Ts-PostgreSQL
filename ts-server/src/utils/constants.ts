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
