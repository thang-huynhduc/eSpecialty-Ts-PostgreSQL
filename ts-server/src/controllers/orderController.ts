import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { orderService } from '../services/orderService.js'
import { CreateOrderDTO } from 'types/IOrder.js'

// Create
const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const newOrder = await orderService.createOrder(userId, req.body as CreateOrderDTO)
    res.status(StatusCodes.CREATED).json({
      success: true,
      order: newOrder
    })
  } catch (error) { next(error) }
}

// Get All
const getAllUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const orders = await orderService.getAllUserOrders(userId)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      orders: orders
    })
  } catch (error) { next(error) }
}

// Get Detail
const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const orderId = req.params.id
    const order = await orderService.getOrderById(userId, orderId)
    res.status(StatusCodes.OK).json({
      success: true,
      order: order
    })
  } catch (error) { next(error) }
}

// Cancel
const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const orderId = req.params.id
    const result = await orderService.cancelOrder(userId, orderId)
    res.status(StatusCodes.OK).json({
      success: true,
      result
    })
  } catch (error) { next(error) }
}

// [ADMIN] Get All
const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getAllOrders()
    res.status(StatusCodes.OK).json({
      success: true,
      orders: orders
    })
  } catch (error) { next(error) }
}

// [ADMIN] Get By User ID
const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params // Lấy userId từ URL (/admin/user/:userId)
    const orders = await orderService.getOrdersByUserId(userId)
    res.status(StatusCodes.OK).json(orders)
  } catch (error) { next(error) }
}

// [ADMIN] Update Status
const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status, paymentStatus } = req.body
    await orderService.updateOrderStatus(id, status, paymentStatus)
    res.status(StatusCodes.OK).json({
      success: true
    })
  } catch (error) { next(error) }
}

// [ADMIN] Delete
const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const result = await orderService.deleteOrder(id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const calculateFee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { districtId, wardCode, items } = req.body

    // Validate dữ liệu đầu vào
    if (!districtId || !wardCode || !items || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Thiếu thông tin địa chỉ hoặc giỏ hàng trống'
      })
      return
    }

    // Gọi service
    const feeData = await orderService.calculateShippingFee(
      Number(districtId),
      String(wardCode),
      items
    )

    res.status(200).json({
      success: true,
      data: {
        total: feeData.total, // Tổng phí ship
        service_fee: feeData.service_fee, // Phí dịch vụ
        insurance_fee: feeData.insurance_fee // Phí bảo hiểm
      }
    })
  } catch (error) {
    next(error)
  }
}

export const orderController = {
  createOrder,
  getAllUserOrders,
  getOrderById,
  cancelOrder,
  // Admin
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  deleteOrder,
  // GHN
  calculateFee
}
