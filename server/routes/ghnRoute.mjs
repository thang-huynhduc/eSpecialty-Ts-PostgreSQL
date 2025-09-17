import { Router } from "express";
import ghnService from "../services/ghnService.js";

const router = Router();
const routeValue = "/api/ghn/";

router.get(`${routeValue}provinces`, async (req, res) => {
  try {
    const result = await ghnService.getProvinces();
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get(`${routeValue}districts/:provinceId`, async (req, res) => {
  try {
    const { provinceId } = req.params;
    const result = await ghnService.getDistricts(parseInt(provinceId));
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get(`${routeValue}wards/:districtId`, async (req, res) => {
  try {
    const { districtId } = req.params;
    const result = await ghnService.getWards(parseInt(districtId));
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post(`${routeValue}calculate-fee`, async (req, res) => {
  try {
    const result = await ghnService.calculateShippingFee(req.body);
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.get(`${routeValue}services/:fromDistrictId/:toDistrictId`, async (req, res) => {
  try {
    const { fromDistrictId, toDistrictId } = req.params;
    const result = await ghnService.getServices(parseInt(fromDistrictId), parseInt(toDistrictId));
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

router.post(`${routeValue}webhook`, async (req, res) => {
  try {
    const { OrderCode, Status, ExpectedDeliveryTime } = req.body;
    
    const orderModel = (await import("../models/orderModel.js")).default;
    
    const order = await orderModel.findOne({ ghnOrderCode: OrderCode });
    if (order) {
      order.ghnStatus = Status;
      if (ExpectedDeliveryTime) {
        order.ghnExpectedDeliveryTime = new Date(ExpectedDeliveryTime);
      }
      
      const statusMapping = {
        'ready_to_pick': 'confirmed',
        'picking': 'confirmed',
        'money_collect_picking': 'confirmed',
        'picked': 'shipped',
        'storing': 'shipped',
        'transporting': 'shipped',
        'sorting': 'shipped',
        'delivering': 'shipped',
        'money_collect_delivering': 'shipped',
        'delivered': 'delivered',
        'delivery_fail': 'pending',
        'waiting_to_return': 'pending',
        'return': 'cancelled',
        'return_transporting': 'cancelled',
        'return_sorting': 'cancelled',
        'returning': 'cancelled',
        'return_fail': 'cancelled',
        'returned': 'cancelled',
        'exception': 'pending',
        'damage': 'cancelled',
        'lost': 'cancelled'
      };
      
      if (statusMapping[Status]) {
        order.status = statusMapping[Status];
      }
      
      await order.save();
    }
    
    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error('GHN Webhook error:', error);
    res.json({ success: false, message: error.message });
  }
});

export default router;
