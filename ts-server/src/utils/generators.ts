import crypto from 'crypto'

export const generateNumericOTP = (length: number = 6): string => {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    // Dùng crypto.randomInt an toàn hơn Math.random()
    otp += digits[crypto.randomInt(0, 10)]
  }
  return otp
}