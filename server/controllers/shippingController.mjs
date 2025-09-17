import ghnService from "../services/ghnService.js";

const calculateShippingFee = async (req, res) => {
  try {
    const { toDistrictId, toWardCode, weight, items } = req.body;
    
    if (!toDistrictId || !toWardCode) {
      return res.json({
        success: false,
        message: "District ID and Ward Code are required"
      });
    }

    const totalWeight = weight || (items ? items.reduce((total, item) => 
      total + (item.weight || 500) * item.quantity, 0) : 500);

    const result = await ghnService.calculateShippingFee({
      toDistrictId,
      toWardCode,
      weight: totalWeight
    });

    res.json(result);
  } catch (error) {
    console.error('Calculate shipping fee error:', error);
    res.json({
      success: false,
      message: error.message
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
