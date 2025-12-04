import type { NextFunction, Request, Response } from 'express'
import { userService } from 'services/userService.js'
import type { AddAddressDTO, LoginDTO, RegisterDTO, SendOtpDTO, VerifyOtpDTO } from 'types/IAuth.js'
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

    res.cookie('accessToken', result.token.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    res.cookie('refreshToken', result.token.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    return res.status(StatusCodes.OK).json({
      message: 'Đăng nhập thành công',
      success: true,
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
    const userId = req.jwtDecoded?.userId as string
    const user = await userService.getUserProfile(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      user: user
    })
  } catch (error) {
    next(error)
  }
}

/** Address */
const addUserAddress = async (
  req: Request<unknown, unknown, AddAddressDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy userId từ token (đã qua authMiddleware)
    // Lưu ý: Đảm bảo đã config type cho req.jwtDecoded như bài trước
    const userId = req.jwtDecoded?.userId as string

    const newAddress = await userService.addUserAddress(userId, req.body)

    res.status(StatusCodes.CREATED).json({
      message: 'Thêm địa chỉ thành công',
      success: true,
      data: newAddress
    })
  } catch (error) {
    next(error)
  }
}

// GET ALL
const getUserAddress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Lấy userId từ token (đã qua authMiddleware)
    // Lưu ý: Đảm bảo đã config type cho req.jwtDecoded như bài trước
    const userId = req.jwtDecoded?.userId as string

    const addresses = await userService.getUserAddresses(userId)

    res.status(StatusCodes.OK).json({
      success: true,
      addresses: addresses
    })
  } catch (error) {
    next(error)
  }
}

// Update
const updateUserAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const { addressId } = req.params

    const updated = await userService.updateUserAddress(userId, addressId, req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Update success',
      data: updated
    })
  } catch (error) { next(error) }
}

// Set Default
const setDefaultAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const { addressId } = req.params
    const result = await userService.setDefaultAddress(userId, addressId)
    res.status(StatusCodes.OK).json({ success: true, message: 'Set default success', data: result })
  } catch (error) { next(error) }
}

// Delete
const deleteUserAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.jwtDecoded?.userId as string
    const { addressId } = req.params
    await userService.deleteUserAddress(userId, addressId)
    res.status(StatusCodes.OK).json({
      success: true
    })
  } catch (error) { next(error) }
}

export const userController = {
  userRegister,
  userLogin,
  adminLogin,
  logout,
  sendOtp,
  verifyOtp,
  // Profile
  getUserProfile,
  addUserAddress,
  getUserAddress,
  updateUserAddress,
  setDefaultAddress,
  deleteUserAddress
}
