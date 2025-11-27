import type { Request, Response } from 'express'
import { authService } from 'services/userService.js'
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

    res.cookie('access-token', result.token.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.cookie('refresh-token', result.token.refreshToken, {
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

const adminLogin = async (
  req: Request<unknown, unknown, RegisterDTO>,
  res: Response
) => {
  try {
    const result = await authService.adminLogin(req.body)

    res.cookie('access-token', result.token.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.cookie('refresh-token', result.token.refreshToken, {
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

const logout = async (
  req: Request<unknown, unknown, RegisterDTO>,
  res: Response
) => {
  try {

    // Xóa cookie
    res.clearCookie('access-token')
    res.clearCookie('refresh-token')

    return res.status(StatusCodes.OK).json({
      message: 'Đăng xuất thành công',
      loggedOut: true
    })
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Đã xảy ra lỗi không xác định'
    const status = err instanceof ApiError ? err.statusCode : 500

    return res.status(status).json({ message })
  }
}

export const userController = {
  userRegister,
  userLogin,
  adminLogin,
  logout
}
