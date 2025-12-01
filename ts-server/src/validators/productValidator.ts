import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/apiError.js'
import type { Request, Response, NextFunction } from 'express'

const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    name: Joi.string().required().min(5).max(255).trim(),
    type: Joi.string().optional().default('general'),
    price: Joi.number().required().min(0),
    discountedPercentage: Joi.number().optional().min(0).max(100),
    stock: Joi.number().optional().min(0),
    description: Joi.string().required(),
    // Tags có thể gửi lên dạng mảng hoặc không
    tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    weight: Joi.number().optional().min(0),
    isAvailable: Joi.boolean().optional(),
    badge: Joi.boolean().optional(),
    offer: Joi.boolean().optional(),
    stockThreshold: Joi.number().optional().min(0),
    categoryId: Joi.string().optional().guid({ version: 'uuidv4' }),
    brandId: Joi.string().optional().guid({ version: 'uuidv4' })
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    // Validate file thủ công (Bắt buộc có ít nhất 1 ảnh)
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      throw new Error('At least one product image is required!')
    }
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    name: Joi.string().optional().min(5).max(255).trim(),
    type: Joi.string().optional(),
    price: Joi.number().optional().min(0),
    discountedPercentage: Joi.number().optional().min(0).max(100),
    stock: Joi.number().optional().min(0),
    description: Joi.string().optional(),
    // Tags có thể gửi lên dạng mảng hoặc không
    tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    weight: Joi.number().optional().min(0),
    isAvailable: Joi.boolean().optional(),
    badge: Joi.boolean().optional(),
    offer: Joi.boolean().optional(),
    stockThreshold: Joi.number().optional().min(0),
    categoryId: Joi.string().optional().guid({ version: 'uuidv4' }),
    brandId: Joi.string().optional().guid({ version: 'uuidv4' })
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    // // Validate file thủ công (Bắt buộc có ít nhất 1 ảnh)
    // if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    //   throw new Error('At least one product image is required!')
    // }
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  const condition = Joi.object({
    stock: Joi.number().required().min(0)
  })
  try {
    await condition.validateAsync(req.body)
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, (error as Error).message))
  }
}

export const productValidator = {
  createProduct,
  updateProduct,
  updateStock
}
