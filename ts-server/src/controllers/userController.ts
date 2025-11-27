import type { NextFunction, Request, Response } from 'express'
import { userService } from 'services/userService.js'
import type { LoginDTO, RegisterDTO, SendOtpDTO, VerifyOtpDTO } from 'dtos/authDTO.js'
import ApiError from 'utils/apiError.js'
import { StatusCodes } from 'http-status-codes'
import ms from 'ms'

/** Auth */
const userRegister = async (
  req: Request<unknown, unknown, RegisterDTO>,
  res: Response
) => {
  try {
    const newUser = await userService.registerUser(req.body)

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
  req: Request<unknown, unknown, LoginDTO>,
  res: Response
) => {
  try {
    const result = await userService.login(req.body)

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
  req: Request<unknown, unknown, LoginDTO>,
  res: Response
) => {
  try {
    const result = await userService.adminLogin(req.body)

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
  req: Request,
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

/** OTP */
export const sendOtp = async (
  req: Request<unknown, unknown, SendOtpDTO>, // Generics để check type body
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate req.body ở đây nếu cần (dùng Joi)
    const result = await userService.sendOtp(req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const verifyOtp = async (
  req: Request<unknown, unknown, VerifyOtpDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await userService.verifyOtp(req.body)

    res.status(StatusCodes.OK).json({
      message: 'Xác thực OTP thành công',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

/** Profile */
interface GetProfileReqBody {
  email: string;
}
export const getUserProfile = async (
  req: Request<unknown, unknown, GetProfileReqBody>, // Generics để check type body
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body
    const result = await userService.getUserProfile(email)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const userController = {
  userRegister,
  userLogin,
  adminLogin,
  logout,
  sendOtp,
  verifyOtp,
  getUserProfile
}
