import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../utils/apiError.js'
import type { Request, Response, NextFunction } from 'express'

// Validate Tạo mới
const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    name: Joi.string().required().min(2).max(50).trim().messages({
      'any.required': 'Tên danh mục là bắt buộc',
      'string.empty': 'Tên danh mục không được để trống'
    }),
    description: Joi.string().optional().allow(null, ''),
    isActive: Joi.boolean().default(true)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })

    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

// Validate Update
const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    name: Joi.string().optional().min(2).max(50).trim(),
    description: Joi.string().optional().allow(null, ''),
    isActive: Joi.boolean().optional()
  })

  try {
    if (!req.params.id) throw new ApiError(StatusCodes.BAD_REQUEST, 'Category ID is required')

    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

// Check ID (Dùng cho GetDetail, Delete)
const checkCategoryId = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    id: Joi.string().required().guid({ version: 'uuidv4' })
  })
  try {
    await correctCondition.validateAsync({ id: req.params.id }, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.BAD_REQUEST, `Category ID invalid ${error}`))
  }
}

export const categoryValidator = {
  createCategory,
  updateCategory,
  checkCategoryId
}
