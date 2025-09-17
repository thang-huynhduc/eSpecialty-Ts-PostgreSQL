import { Router } from "express";
import { calculateShippingFee, getShippingServices } from "../controllers/shippingController.mjs";
import userAuth from "../middleware/userAuth.js";

const router = Router();
const routeValue = "/api/shipping/";

router.post(`${routeValue}calculate-fee`, userAuth, calculateShippingFee);
router.get(`${routeValue}services/:fromDistrictId/:toDistrictId`, userAuth, getShippingServices);

export default router;
