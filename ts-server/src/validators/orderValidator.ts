import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/apiError.js'
import type { Request, Response, NextFunction } from 'express'
import { OrderStatus, PaymentMethod } from 'generated/prisma/enums.js'

const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    // Validate mảng items
    items: Joi.array().items(
      Joi.object({
        productId: Joi.string().required().guid({ version: 'uuidv4' }),
        quantity: Joi.number().required().min(1)
      })
    ).required().min(1).messages({ 'array.min': 'Giỏ hàng không được để trống' }),

    // Validate địa chỉ (Object JSON)
    shippingAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      phone: Joi.string().required().pattern(/^[0-9]{10,11}$/)
    }).unknown(true).required(), // unknown(true) để cho phép các trường khác như ward, district...

    paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).default(PaymentMethod.cod),
    shippingFee: Joi.number().min(0).default(0)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

const checkOrderId = async (req: Request, res: Response, next: NextFunction) => {
  // Validate ID params
  if (!req.params.id) return next(new ApiError(StatusCodes.BAD_REQUEST, 'Order ID Required'))
  next()
}

const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    status: Joi.string()
      .valid(...Object.values(OrderStatus)) // Chỉ chấp nhận: pending, confirmed, shipped...
      .required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

export const orderValidator = {
  createOrder,
  checkOrderId,
  updateOrderStatus
}
