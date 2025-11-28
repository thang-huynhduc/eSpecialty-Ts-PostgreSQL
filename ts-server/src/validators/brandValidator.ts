import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '../utils/apiError.js' // Nhớ check lại đường dẫn import
import type { Request, Response, NextFunction } from 'express'

const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    name: Joi.string().required().min(2).max(50).trim().messages({
      'any.required': 'Tên thương hiệu là bắt buộc',
      'string.empty': 'Tên thương hiệu không được để trống'
    }),
    description: Joi.string().optional().allow(null, ''), // Cho phép rỗng
    website: Joi.string().optional().uri().allow(null, ''), // Check đúng định dạng URL
    isActive: Joi.boolean().default(true)
  })

  try {
    // 1. Validate các trường text trong body
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = (error as Error).message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    // Tất cả đều optional vì user có thể chỉ muốn sửa description thôi
    name: Joi.string().optional().min(2).max(50).trim(),
    description: Joi.string().optional().allow(null, ''),
    website: Joi.string().optional().uri().allow(null, ''),
    isActive: Joi.boolean().optional()
  })

  try {
    // 1. Check ID trên params
    if (!req.params.id) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Brand ID is required')
    }
    // 2. Check Body
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

const checkBrandId = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    id: Joi.string().required().guid({ version: 'uuidv4' }).messages({
      'string.guid': 'Brand ID must be a valid UUID'
    })
  })

  try {
    // Validate params
    await correctCondition.validateAsync({ id: req.params.id }, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, (error as Error).message))
  }
}

export const brandValidator = {
  createBrand,
  updateBrand,
  checkBrandId
}
