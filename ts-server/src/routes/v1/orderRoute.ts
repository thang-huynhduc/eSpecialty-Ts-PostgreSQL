import express from 'express'
import { authMiddleware } from 'middlewares/authMiddleware.js'
import { orderController } from 'controllers/orderController.js'
import { orderValidator } from 'validators/orderValidator.js'

const Router = express.Router()
// /api/order

/** User Route */
Router.route('/')
  .get(authMiddleware.isAuthorize, authMiddleware.userAuth, orderController.getAllUserOrders)
  .post(authMiddleware.isAuthorize, authMiddleware.userAuth, orderValidator.createOrder, orderController.createOrder)

Router.route('/:id')
  .get(authMiddleware.isAuthorize, authMiddleware.userAuth, orderValidator.checkOrderId, orderController.getOrderById)

Router.route('/:id/cancel')
  .patch(authMiddleware.isAuthorize, authMiddleware.userAuth, orderValidator.checkOrderId, orderController.cancelOrder)

/** Admin Route */
// 1. Lấy tất cả đơn hàng (cho Dashboard)
Router.route('/admin/all-orders')
  .get(authMiddleware.isAuthorize, authMiddleware.adminAuth, orderController.getAllOrders)

// 2. Lấy đơn hàng của một User cụ thể
Router.route('/admin/user/:userId')
  .get(authMiddleware.isAuthorize, authMiddleware.adminAuth, orderController.getUserOrders)

// 3. Cập nhật trạng thái đơn (Duyệt đơn, Giao hàng...)
Router.route('/admin/:id/status')
  .put(authMiddleware.isAuthorize, authMiddleware.adminAuth, orderValidator.checkOrderId, orderValidator.updateOrderStatus, orderController.updateOrderStatus)

// 4. Xóa đơn hàng
Router.route('/admin/:id')
  .delete(authMiddleware.isAuthorize, authMiddleware.adminAuth, orderValidator.checkOrderId, orderController.deleteOrder)

export const orderRoute = Router