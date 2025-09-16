/**
 * Currency formatting utilities for VND - Admin Version
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

export default {
  formatVND,
  formatVNDSimple
};
