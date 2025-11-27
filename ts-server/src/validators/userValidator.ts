import { StatusCodes } from 'http-status-codes'
import Joi from 'joi'
import ApiError from '../utils/apiError.js' // Nhớ check lại đường dẫn import
import { EMAIL_RULE, EMAIL_RULE_MESSAGE, PASSWORD_RULE, PASSWORD_RULE_MESSAGE } from '../utils/validators.js'
import type { Request, Response, NextFunction } from 'express'

const createNew = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE),
    name: Joi.string().required().pattern(/^[A-Za-zÀ-ỹ\s]{2,50}$/).message('Name can only contain letters and spaces.')
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    // Ép kiểu error về Error để lấy message
    // Lưu ý: Không dùng new Error(error) vì nó sẽ ra "[object Object]"
    const errorMessage = (error as Error).message

    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    password: Joi.string().required().pattern(PASSWORD_RULE).message(PASSWORD_RULE_MESSAGE)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    // Tương tự ở trên
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

const verifyAccount = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    email: Joi.string().required().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    otp: Joi.string().required(),
    type: Joi.string().required()
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    label: Joi.string().optional().max(50),
    street: Joi.string().required().min(5).trim().messages({
      'any.required': 'Địa chỉ đường phố là bắt buộc',
      'string.min': 'Địa chỉ quá ngắn'
    }),
    ward: Joi.string().optional(),
    district: Joi.string().optional(),
    city: Joi.string().optional(),
    provinceId: Joi.number().optional(),
    districtId: Joi.number().optional(),
    wardCode: Joi.string().optional(),
    zipCode: Joi.string().optional().pattern(/^\d{4,6}$/),
    country: Joi.string().default('Vietnam'),
    phone: Joi.string().required().pattern(/^[0-9]{10,11}$/).messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ (10-11 số)'
    }),
    isDefault: Joi.boolean().default(false)
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    const errorMessage = (error as Error).message
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage))
  }
}

const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  const correctCondition = Joi.object({
    // Cho phép sửa từng phần, không bắt buộc nhập hết
    label: Joi.string().optional().max(50),
    street: Joi.string().optional().min(5).trim(),
    ward: Joi.string().optional(),
    district: Joi.string().optional(),
    city: Joi.string().optional(),
    provinceId: Joi.number().optional(),
    districtId: Joi.number().optional(),
    wardCode: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional(),
    phone: Joi.string().optional().pattern(/^[0-9]{10,11}$/),
    isDefault: Joi.boolean().optional() // User có thể set default ngay lúc update
  })

  try {
    await correctCondition.validateAsync(req.body, { abortEarly: false })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, (error as Error).message))
  }
}

// Validator cho Params (check ID)
const checkAddressId = async (req: Request, res: Response, next: NextFunction) => {
  // Giả sử ID là UUID hoặc String. Nếu ID rỗng thì báo lỗi.
  if (!req.params.addressId) {
    next(new ApiError(StatusCodes.BAD_REQUEST, 'Address ID is required'))
    return
  }
  next()
}

export const userValidator = {
  createNew,
  login,
  verifyAccount,
  addAddress,
  updateAddress,
  checkAddressId
}
