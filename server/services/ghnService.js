import { ghn } from '../config/ghn.js';
import axios from 'axios'
const GHN_API_URL = "https://dev-online-gateway.ghn.vn/shiip/public-api/v2";
const TOKEN = process.env.GHN_TOKEN;   // từ .env
const SHOP_ID = process.env.GHN_SHOP_ID; // từ .env
const FROM_DISTRICT_ID = 1450; // Quận 1

class GHNService {
  async getProvinces() {
    try {
      const response = await ghn.address.getProvinces();
      console.log('GHN getProvinces response:', response);
      return {
        success: true,
        data: response || []
      };
    } catch (error) {
      console.error('GHN getProvinces error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  async getDistricts(provinceId) {
    try {
      const response = await ghn.address.getDistricts(provinceId);
      return {
        success: true,
        data: response|| []
      };
    } catch (error) {
      console.error('GHN getDistricts error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  async getWards(districtId) {
    try {
      const response = await ghn.address.getWards(districtId);
      return {
        success: true,
        data: response || []
      };
    } catch (error) {
      console.error('GHN getWards error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  async calculateShippingFee({ toDistrictId, toWardCode, weight, serviceId, serviceTypeId }) {
    try {
      const response = await axios.post(
        `${GHN_API_URL}/shipping-order/fee`,
        {
          from_district_id: FROM_DISTRICT_ID,
          service_id: serviceId,
          service_type_id: serviceTypeId,
          to_district_id: toDistrictId,
          to_ward_code: toWardCode,
          weight,
          height: 15,
          length: 15,
          width: 15,
        },
        {
          headers: {
            Token: TOKEN,
            ShopId: SHOP_ID,
            "Content-Type": "application/json",
          },
        }
      );

      return { success: true, data: response.data.data };
    } catch (error) {
      console.error("GHN calculateShippingFee error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "GHN API error",
      };
    }
  }
  
  async getServices(fromDistrictId, toDistrictId) {
    try {
      const response = await axios.post(
        `${GHN_API_URL}/shipping-order/available-services`,
        {
          shop_id: parseInt(SHOP_ID),
          from_district: fromDistrictId,
          to_district: toDistrictId,
        },
        {
          headers: {
            Token: TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message: "Get services success",
        data: response.data.data,
      };
    } catch (error) {
      console.error("GHN getServices error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        data: [],
      };
    }
  }

  async createOrder(orderData) {
    try {
      const response = await axios.post(
        `${GHN_API_URL}/shipping-order/create`,
        {
          ...orderData,
          shop_id: parseInt(SHOP_ID),
          from_district_id: FROM_DISTRICT_ID,
          payment_type_id: orderData.payment_type_id || 1, // Default: Shop thanh toán
          required_note: orderData.required_note || "KHONGCHOXEMHANG",
          return_phone: orderData.return_phone || "0909999999", // Số điện thoại shop, config trong .env nếu cần
          return_address: orderData.return_address || "Default Shop Address", // Địa chỉ shop, config trong .env nếu cần
          client_order_code: orderData.note || "", // Mã đơn hàng nội bộ
        },
        {
          headers: {
            Token: TOKEN,
            "Content-Type": "application/json",
            ShopId: SHOP_ID,
          },
        }
      );

      return {
        success: true,
        data: response.data.data, // { order_code, expected_delivery_time, total_fee, ... }
      };
    } catch (error) {
      console.error("GHN createOrder error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "GHN API error",
        data: {},
      };
    }
  }

  async getOrderInfo(orderCode) {
    try {
      const response = await axios.get(
        `${GHN_API_URL}/shipping-order/detail`,
        {
          params: { order_code: orderCode },
          headers: {
            Token: TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("GHN getOrderInfo error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "GHN API error",
        data: {},
      };
    }
  }

  async cancelOrder(orderCodes) {
    try {
      const response = await axios.post(
        `${GHN_API_URL}/switch-status/cancel`,
        {
          order_codes: orderCodes, // Array of order codes, e.g., ["GHN12345"]
        },
        {
          headers: {
            Token: TOKEN,
            "Content-Type": "application/json",
            ShopId: SHOP_ID,
          },
        }
      );

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("GHN cancelOrder error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message || "GHN API error",
        data: {},
      };
    }
  }
}

export default new GHNService();