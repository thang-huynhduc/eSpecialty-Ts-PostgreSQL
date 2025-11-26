import type { Request, Response } from 'express'
import { authService } from 'services/authService.js'
import type { RegisterDTO } from 'dtos/authDTO.js'
import ApiError from 'utils/apiError.js'
import { StatusCodes } from 'http-status-codes'
import ms from 'ms'

const userRegister = async (
  req: Request<unknown, unknown, RegisterDTO>,
  res: Response
) => {
  try {
    const newUser = await authService.registerUser(req.body)

    return res.status(StatusCodes.OK).json({
      message: 'Đăng ký thành công',
      data: newUser
    })
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Đã xảy ra lỗi không xác định'
    const status = err instanceof ApiError ? err.statusCode : 500

    return res.status(status).json({ message })
  }
}

const userLogin = async (
  req: Request<unknown, unknown, RegisterDTO>,
  res: Response
) => {
  try {
    const result = await authService.login(req.body)

    res.cookie('access-token', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.cookie('refresh-token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    return res.status(StatusCodes.OK).json({
      message: 'Đăng nhập thành công',
      data: result
    })
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Đã xảy ra lỗi không xác định'
    const status = err instanceof ApiError ? err.statusCode : 500

    return res.status(status).json({ message })
  }
}

export const authController = {
  userRegister,
  userLogin
}
