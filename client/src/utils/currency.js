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

// Convert USD to approximate VND (for display purposes only)
export const usdToVND = (usdAmount, exchangeRate = 24400) => {
  return Math.round(usdAmount * exchangeRate);
};

// Convert VND to USD (for payment processing - internal use only)
export const vndToUSD = (vndAmount, exchangeRate = 0.000041) => {
  return Math.round(vndAmount * exchangeRate * 100) / 100;
};

// Always display amounts in VND - main currency formatter
export const displayAmount = (amount, currency = 'VND') => {
  // Always convert to VND for display, regardless of internal currency
  if (currency === 'USD') {
    // If we somehow get USD amount, convert it back to VND for display
    return formatVND(usdToVND(amount));
  }
  return formatVND(amount);
};

// Get display currency (always VND)
export const getDisplayCurrency = () => 'VND';

// Format amount for admin/client display (always VND)
export const formatForDisplay = (originalAmount, processedAmount = null, originalCurrency = 'VND', processedCurrency = null) => {
  // Always return VND amount for display
  if (originalCurrency === 'VND') {
    return {
      amount: originalAmount,
      currency: 'VND',
      formatted: formatVND(originalAmount)
    };
  }
  
  // If original was not VND, try to use processed amount converted back
  if (processedAmount && processedCurrency === 'USD') {
    const vndAmount = usdToVND(processedAmount);
    return {
      amount: vndAmount,
      currency: 'VND',
      formatted: formatVND(vndAmount)
    };
  }
  
  // Fallback to original amount as VND
  return {
    amount: originalAmount,
    currency: 'VND',
    formatted: formatVND(originalAmount)
  };
};

export const formatPriceShort = (amount) => {
  if (!amount || isNaN(amount)) return "0";
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    const millions = (absAmount / 1000000).toFixed(1);
    return `${millions.replace(/\.0$/, "")}tr`;
  } else if (absAmount >= 1000) {
    const thousands = (absAmount / 1000).toFixed(1);
    return `${thousands.replace(/\.0$/, "")}k`;
  } else {
    return absAmount.toLocaleString("vi-VN");
  }
};

export default {
  formatVND,
  formatVNDSimple,
  usdToVND,
  vndToUSD,
  displayAmount,
  getDisplayCurrency,
  formatForDisplay,
  formatPriceShort
};

