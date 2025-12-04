import { addressController } from 'controllers/GHNAddressController.js'
import express from 'express'
// import validator nếu cần, nhưng API lấy địa chỉ thường public nên em để thoáng

const Router = express.Router()

// Route: /api/ghn/provinces
Router.route('/provinces')
  .get(addressController.getProvinces)

// Route: /api/ghn/districts?province_id=...
Router.route('/districts')
  .get(addressController.getDistricts)

// Route: /api/ghn/wards?district_id=...
Router.route('/wards')
  .get(addressController.getWards)

export const ghnRoute = Router
