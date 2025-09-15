/**
 * Currency formatting utilities for VND
 */

export const formatVND = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatVNDSimple = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    amount = 0;
  }
  
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

// Convert USD to approximate VND (for reference only)
export const usdToVND = (usdAmount, exchangeRate = 24400) => {
  return Math.round(usdAmount * exchangeRate);
};

// Convert VND to USD (for payment processing)
export const vndToUSD = (vndAmount, exchangeRate = 0.000041) => {
  return Math.round(vndAmount * exchangeRate * 100) / 100;
};

export default {
  formatVND,
  formatVNDSimple,
  usdToVND,
  vndToUSD
};

