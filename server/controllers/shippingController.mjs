import ghnService from "../services/ghnService.js";

const calculateShippingFee = async (req, res) => {
  try {
    const { toDistrictId, toWardCode, weight, items, serviceId, serviceTypeId } = req.body;

    if (!toDistrictId || !toWardCode) {
      return res.status(400).json({
        success: false,
        message: "District ID and Ward Code are required",
      });
    }

    let totalWeight;
    if (weight) {
      totalWeight = weight;
    } else if (items && Array.isArray(items) && items.length > 0) {
      totalWeight = items.reduce((total, item) => {
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new Error('Invalid item quantity');
        }
        return total + (item.weight || 500) * item.quantity;
      }, 0);
    } else {
      throw new Error('Weight or items must be provided');
    }

    const result = await ghnService.calculateShippingFee({
      toDistrictId,
      toWardCode,
      weight: totalWeight,
      serviceId,
      serviceTypeId,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Calculate shipping fee error:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getShippingServices = async (req, res) => {
  try {
    const { fromDistrictId, toDistrictId } = req.params;
    
    if (!fromDistrictId || !toDistrictId) {
      return res.json({
        success: false,
        message: "From and To District IDs are required"
      });
    }

    const result = await ghnService.getServices(parseInt(fromDistrictId), parseInt(toDistrictId));
    res.json(result);
  } catch (error) {
    console.error('Get shipping services error:', error);
    res.json({
      success: false,
      message: error.message
    });
  }
};

export {
  calculateShippingFee,
  getShippingServices
};
