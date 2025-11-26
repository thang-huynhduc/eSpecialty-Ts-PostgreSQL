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

export const authValidator = {
  createNew,
  login
}
