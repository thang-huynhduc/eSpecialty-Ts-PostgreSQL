import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { orderService } from '../services/orderService.js'
import { CreateOrderDTO } from 'dtos/orderDTO.js'

// Create
const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const newOrder = await orderService.createOrder(userId, req.body as CreateOrderDTO)
    res.status(StatusCodes.CREATED).json(newOrder)
  } catch (error) { next(error) }
}

// Get All
const getAllUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const orders = await orderService.getAllUserOrders(userId)
    res.status(StatusCodes.OK).json(orders)
  } catch (error) { next(error) }
}

// Get Detail
const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const orderId = req.params.id
    const order = await orderService.getOrderById(userId, orderId)
    res.status(StatusCodes.OK).json(order)
  } catch (error) { next(error) }
}

// Cancel
const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const orderId = req.params.id
    const result = await orderService.cancelOrder(userId, orderId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

// [ADMIN] Get All
const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await orderService.getAllOrders()
    res.status(StatusCodes.OK).json(orders)
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
    const { status } = req.body
    const result = await orderService.updateOrderStatus(id, status)
    res.status(StatusCodes.OK).json(result)
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

export const orderController = {
  createOrder,
  getAllUserOrders,
  getOrderById,
  cancelOrder,
  // Admin
  getAllOrders,
  getUserOrders,
  updateOrderStatus,
  deleteOrder
}
