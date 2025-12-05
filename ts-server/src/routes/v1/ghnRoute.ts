import { GHNController } from 'controllers/GHNController.js'
import express from 'express'
// import validator nếu cần, nhưng API lấy địa chỉ thường public nên em để thoáng

const Router = express.Router()

// Route: /api/ghn/provinces
Router.route('/provinces')
  .get(GHNController.getProvinces)

// Route: /api/ghn/districts?province_id=...
Router.route('/districts')
  .get(GHNController.getDistricts)

// Route: /api/ghn/wards?district_id=...
Router.route('/wards')
  .get(GHNController.getWards)

Router.route('/')
  .post(GHNController.handleGHNWebhook)

export const ghnRoute = Router
