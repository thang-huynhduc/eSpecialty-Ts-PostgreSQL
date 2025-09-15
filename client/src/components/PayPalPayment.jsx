import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { FaPaypal, FaSpinner, FaExchangeAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import PriceFormat from "./PriceFormat";
const API_URL = import.meta.env.VITE_BACKEND_URL;

const PayPalPayment = ({ orderId, amount, onSuccess, onCancel, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  // PayPal initial options
  const initialOptions = {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
    "enable-funding": "venmo",
    "disable-funding": "paylater,card",
    "data-sdk-integration-source": "react-paypal-js",
  };

  // Check if PayPal client ID is configured
  useEffect(() => {
    if (!import.meta.env.VITE_PAYPAL_CLIENT_ID) {
      console.error("PayPal Client ID not found in environment variables");
      setError("PayPal Client ID not configured");
    }
  }, []);

  // Prepare order data on component mount
  useEffect(() => {
    prepareOrderData();
  }, [orderId]);

  const prepareOrderData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Just prepare the data, don't create PayPal order yet
      setOrderData({
        orderId,
        amount,
        currency: "VND"
      });
      
      console.log("Order data prepared for PayPal:", { orderId, amount });
    } catch (error) {
      console.error("Error preparing order data:", error);
      setError("Failed to prepare order data");
    } finally {
      setIsLoading(false);
    }
  };

  // Create PayPal order when user clicks the PayPal button
  const createOrder = async (data, actions) => {
    try {
      console.log("Creating PayPal order...");
      
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/payment/paypal/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            orderId,
            currency: "VND" 
          }),
        }
      );

      const result = await response.json();
      console.log("PayPal order creation response:", result);

      if (result.success) {
        // Store exchange data for display
        if (result.amount && result.exchangeRate) {
          setOrderData(prev => ({
            ...prev,
            exchangeData: {
              vnd: result.amount.vnd,
              usd: result.amount.usd,
              rate: result.exchangeRate,
            }
          }));
        }
        
        console.log("PayPal order created successfully:", result.paypalOrderId);
        return result.paypalOrderId;
      } else {
        console.error("PayPal order creation failed:", result.message);
        toast.error(result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("PayPal order creation error:", error);
      toast.error("Failed to create PayPal order. Please try again.");
      throw error;
    }
  };

  const handleApprove = async (data, actions) => {
    try {
      setIsLoading(true);
      console.log("Approving PayPal payment:", data);
      
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/payment/paypal/capture-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paypalOrderId: data.orderID,
            orderId: orderId,
          }),
        }
      );

      const result = await response.json();
      console.log("PayPal capture response:", result);

      if (result.success) {
        if (result.alreadyCaptured) {
          toast.success("Payment was already captured");
        } else {
          toast.success("Payment captured successfully!");
        }
        onSuccess?.(result.captureId, result.order);
      } else {
        console.error("PayPal capture failed:", result.message);
        toast.error(result.message);
        onError?.(result.message);
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      toast.error("Payment capture failed. Please try again.");
      onError?.("Payment capture failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (data) => {
    console.log("PayPal payment cancelled:", data);
    toast.info("Payment was cancelled");
    onCancel?.();
  };

  const handlePayPalError = (err) => {
    console.error("PayPal error:", err);
    toast.error("PayPal payment failed. Please try again.");
    onError?.(err);
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaPaypal className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Pay with PayPal</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">{error}</p>
          
          {/* Debug information */}
          {import.meta.env.DEV && (
            <div className="mt-3 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>Client ID: {import.meta.env.VITE_PAYPAL_CLIENT_ID ? 'Set' : 'Not Set'}</p>
              <p>API URL: {API_URL}</p>
              <p>Order ID: {orderId}</p>
              <p>Amount: {amount}</p>
            </div>
          )}
          
          <button
            onClick={prepareOrderData}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <FaPaypal className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-900">Pay with PayPal</h3>
      </div>

      {/* Currency Exchange Information */}
      {orderData?.exchangeData && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FaExchangeAlt className="text-blue-600" />
            <span className="font-medium text-blue-800">Currency Conversion</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Amount (VND):</span>
              <span className="font-medium">
                <PriceFormat amount={orderData.exchangeData.vnd} />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PayPal Amount (USD):</span>
              <span className="font-medium text-blue-600">
                ${orderData.exchangeData.usd.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Exchange Rate:</span>
              <span className="font-mono text-xs">
                1 VND = ${orderData.exchangeData.rate.toFixed(6)} USD
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PayPal Buttons */}
      {orderData && !error && (
        <PayPalScriptProvider options={initialOptions}>
          <PayPalButtons
            style={{
              layout: "vertical",
              color: "blue",
              shape: "rect",
              label: "paypal",
              height: 45,
            }}
            createOrder={createOrder}
            onApprove={handleApprove}
            onCancel={handleCancel}
            onError={handlePayPalError}
            disabled={isLoading}
          />
        </PayPalScriptProvider>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <FaSpinner className="animate-spin w-5 h-5 text-blue-600 mr-2" />
          <span className="text-gray-600 text-sm">Processing payment...</span>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          🔒 Your payment is secured by PayPal's advanced encryption and fraud protection
        </p>
      </div>
    </div>
  );
};

PayPalPayment.propTypes = {
  orderId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onError: PropTypes.func,
};

PayPalPayment.defaultProps = {
  onCancel: () => {},
  onError: () => {},
};

export default PayPalPayment;
