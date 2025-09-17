const { ghn } = require('../config/ghn.js');

class GHNService {
  async getProvinces() {
    try {
      const response = await ghn.getProvinces();
      return {
        success: true,
        data: response.data || []
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
      const response = await ghn.getDistricts(provinceId);
      return {
        success: true,
        data: response.data || []
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
      const response = await ghn.getWards(districtId);
      return {
        success: true,
        data: response.data || []
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

  async calculateShippingFee(data) {
    try {
      const {
        toDistrictId,
        toWardCode,
        weight = 500,
        length = 20,
        width = 20,
        height = 10,
        serviceId = null,
        serviceTypeId = 2
      } = data;

      const shippingData = {
        to_district_id: toDistrictId,
        to_ward_code: toWardCode,
        weight: weight,
        length: length,
        width: width,
        height: height,
        service_type_id: serviceTypeId
      };

      if (serviceId) {
        shippingData.service_id = serviceId;
      }

      const response = await ghn.calculateFee(shippingData);
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error('GHN calculateShippingFee error:', error);
      return {
        success: false,
        message: error.message,
        data: {}
      };
    }
  }

  async getServices(fromDistrictId, toDistrictId) {
    try {
      const response = await ghn.getServices({
        from_district: fromDistrictId,
        to_district: toDistrictId
      });
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('GHN getServices error:', error);
      return {
        success: false,
        message: error.message,
        data: []
      };
    }
  }

  async createOrder(orderData) {
    try {
      const response = await ghn.createOrder(orderData);
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error('GHN createOrder error:', error);
      return {
        success: false,
        message: error.message,
        data: {}
      };
    }
  }

  async getOrderInfo(orderCode) {
    try {
      const response = await ghn.getOrderInfo(orderCode);
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error('GHN getOrderInfo error:', error);
      return {
        success: false,
        message: error.message,
        data: {}
      };
    }
  }

  async cancelOrder(orderCodes) {
    try {
      const response = await ghn.cancelOrder(orderCodes);
      return {
        success: true,
        data: response.data || {}
      };
    } catch (error) {
      console.error('GHN cancelOrder error:', error);
      return {
        success: false,
        message: error.message,
        data: {}
      };
    }
  }
}

module.exports = new GHNService();
