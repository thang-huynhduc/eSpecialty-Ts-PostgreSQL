import { Router } from "express";
import {
  getInventoryStats,
  getLowStockItems,
  getOutOfStockItems,
  bulkUpdateStock,
  getStockMovements,
  getInventoryValuation,
  setStockAlert
} from "../controllers/inventoryController.mjs";
import adminAuth from "../middleware/adminAuth.js";

const router = Router();
const routeValue = "/api/inventory/";

// Get inventory overview statistics
router.get(`${routeValue}stats`, adminAuth, getInventoryStats);

// Get low stock items
router.get(`${routeValue}low-stock`, adminAuth, getLowStockItems);

// Get out of stock items
router.get(`${routeValue}out-of-stock`, adminAuth, getOutOfStockItems);

// Bulk update stock levels
router.post(`${routeValue}bulk-update`, adminAuth, bulkUpdateStock);

// Get stock movement history
router.get(`${routeValue}movements`, adminAuth, getStockMovements);

// Get inventory valuation report
router.get(`${routeValue}valuation`, adminAuth, getInventoryValuation);

// Set stock alert threshold
router.post(`${routeValue}alert-threshold`, adminAuth, setStockAlert);

export default router;