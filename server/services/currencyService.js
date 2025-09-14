import axios from "axios";
import NodeCache from "node-cache";

// Cache for 10 minutes (600 seconds)
const cache = new NodeCache({ stdTTL: 600 });

// Free currency conversion API (you can replace with your preferred service)
const EXCHANGE_API_URL = "https://api.exchangerate-api.com/v4/latest/VND";
const FALLBACK_VND_TO_USD = 0.000041; // Fallback rate: ~24,400 VND = 1 USD

/**
 * Get real-time exchange rate from VND to USD
 * @returns {Promise<number>} Exchange rate (VND to USD)
 */
export const getVNDToUSDRate = async () => {
  const cacheKey = "vnd_to_usd_rate";
  
  try {
    // Check cache first
    const cachedRate = cache.get(cacheKey);
    if (cachedRate) {
      console.log("Using cached exchange rate:", cachedRate);
      return cachedRate;
    }

    console.log("Fetching real-time exchange rate...");
    
    // Retry mechanism with exponential backoff
    const maxRetries = 3;
    let retryDelay = 1000; // Start with 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(EXCHANGE_API_URL, {
          timeout: 5000, // 5 seconds timeout
        });

        if (response.data && response.data.rates && response.data.rates.USD) {
          const rate = response.data.rates.USD;
          
          // Cache the rate
          cache.set(cacheKey, rate);
          console.log(`Exchange rate fetched successfully: 1 VND = ${rate} USD`);
          
          return rate;
        } else {
          throw new Error("Invalid API response format");
        }
      } catch (error) {
        console.error(`Exchange rate fetch attempt ${attempt} failed:`, error.message);
        
        if (attempt === maxRetries) {
          // Last attempt failed, check for fallback cached rate
          const fallbackCachedRate = cache.get(`${cacheKey}_fallback`);
          if (fallbackCachedRate) {
            console.log("Using fallback cached rate:", fallbackCachedRate);
            return fallbackCachedRate;
          }
          
          // Use hardcoded fallback rate
          console.log("Using hardcoded fallback rate:", FALLBACK_VND_TO_USD);
          return FALLBACK_VND_TO_USD;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Double the delay for next attempt
      }
    }
  } catch (error) {
    console.error("Currency conversion service error:", error);
    
    // Try to get fallback cached rate
    const fallbackCachedRate = cache.get(`${cacheKey}_fallback`);
    if (fallbackCachedRate) {
      console.log("Using fallback cached rate:", fallbackCachedRate);
      return fallbackCachedRate;
    }
    
    // Use hardcoded fallback rate
    console.log("Using hardcoded fallback rate:", FALLBACK_VND_TO_USD);
    return FALLBACK_VND_TO_USD;
  }
};

/**
 * Convert VND amount to USD
 * @param {number} vndAmount - Amount in VND
 * @returns {Promise<{usdAmount: number, exchangeRate: number, success: boolean, error?: string}>}
 */
export const convertVNDToUSD = async (vndAmount) => {
  try {
    if (!vndAmount || vndAmount <= 0) {
      throw new Error("Invalid VND amount");
    }

    const exchangeRate = await getVNDToUSDRate();
    const usdAmount = Math.round(vndAmount * exchangeRate * 100) / 100; // Round to 2 decimal places
    
    // PayPal minimum amount is $1.00
    if (usdAmount < 1) {
      throw new Error("Converted USD amount is below PayPal's minimum ($1.00)");
    }

    return {
      success: true,
      usdAmount,
      exchangeRate,
      originalAmount: vndAmount,
    };
  } catch (error) {
    console.error("Currency conversion error:", error);
    return {
      success: false,
      error: error.message,
      exchangeRate: null,
      usdAmount: null,
    };
  }
};

/**
 * Validate if currency is supported by PayPal
 * @param {string} currency - Currency code
 * @returns {boolean}
 */
export const isPayPalSupportedCurrency = (currency) => {
  const supportedCurrencies = [
    "AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", 
    "HUF", "ILS", "JPY", "MYR", "MXN", "TWD", "NZD", "NOK", 
    "PHP", "PLN", "GBP", "RUB", "SGD", "SEK", "CHF", "THB", "USD"
  ];
  
  return supportedCurrencies.includes(currency.toUpperCase());
};

/**
 * Store fallback exchange rate for disaster recovery
 * @param {number} rate - Exchange rate to store as fallback
 */
export const storeFallbackRate = (rate) => {
  const cacheKey = "vnd_to_usd_rate_fallback";
  // Store fallback rate for 24 hours
  cache.set(cacheKey, rate, 86400);
  console.log("Fallback exchange rate stored:", rate);
};

// Auto-store successful rates as fallback
setInterval(async () => {
  try {
    const rate = await getVNDToUSDRate();
    if (rate && rate !== FALLBACK_VND_TO_USD) {
      storeFallbackRate(rate);
    }
  } catch (error) {
    console.error("Failed to store fallback rate:", error);
  }
}, 300000); // Every 5 minutes
