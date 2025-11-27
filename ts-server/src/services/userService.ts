import bcrypt from 'bcryptjs'
import { env } from 'config/environment.js'
import { prisma } from 'config/prisma.js'
import { LoginDTO, RegisterDTO } from 'dtos/authDTO.js'
import { User } from 'generated/prisma/client.js'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from 'providers/JwtProvider.js'
import ApiError from 'utils/apiError.js'
import { LOCK_TIME, MAX_FAILED_ATTEMPTS } from 'utils/constants.js'

// Hàm private dùng cho file này
  const verifyPasswordAndHandleLogin = async (user: User, passwordInput: string) => {
    if (user.lockUntil && user.lockUntil > new Date()) {
    // Tính toán time còn sót lại
    const timeLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)
    throw new ApiError(StatusCodes.LOCKED, `Tài khoản tạm thời bị khóa, vui lòng thử lại sau ${timeLeft} phút.`)
  }

  // 2. So sánh password
  const isMatch = await bcrypt.compare(passwordInput, user.password)  
  if (!isMatch) {
    // Tính toán số lần fail
    const currentFailed = user.failedLoginAttempts + 1

    // Chuẩn bị dữ liệu để update
    const updateData: any = {
      failedLoginAttempts: currentFailed
    }

    // Nếu sai quá giới hạn thì khóa ngay
    if (currentFailed >= MAX_FAILED_ATTEMPTS) {
      updateData.lockUntil = new Date(Date.now() + LOCK_TIME)
    }
    // Update vào DB
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    })

    // Thông báo lỗi
    if (currentFailed >= MAX_FAILED_ATTEMPTS) {
       throw new ApiError(StatusCodes.LOCKED, 'Bạn đã nhập sai quá 5 lần. Tài khoản bị khóa 15 phút.')
    } else {
       throw new ApiError(StatusCodes.NOT_ACCEPTABLE, `Mật khẩu sai. Bạn còn ${MAX_FAILED_ATTEMPTS - currentFailed} lần thử.`)
    }
  }

  // Trường hợp đăng nhập đúng
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0, // Reset về 0
        lockUntil: null,        // Mở khóa
        lastLogin: new Date()   // Cập nhật thời gian login
      }
    })
  } else {
    // Nếu acc đang sạch thì chỉ update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })
  }
}

const registerUser = async (data: RegisterDTO) => {
  // Kiểm tra xem đã tồn tại email của user
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, 'User already exist!')
  }
  // hash pass
  const hashedPassword = await bcrypt.hash(data.password, 10)
  //  Tạo User mới
  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword
    },
    // Chỉ lấy về các trường cần thiết (Select), bỏ qua password
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  })

  return newUser
}

const login = async (data: LoginDTO) => {
  // 1. Tìm user
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email }
  })
  if (!existingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Email hoặc mật khẩu không đúng')
  }

  await verifyPasswordAndHandleLogin(existingUser, data.password)

  // 3. Tạo token JWT
  const userInfomation = { userId: existingUser.id, email: existingUser.email, role: existingUser.role }
  const accessToken = await JwtProvider.generateToken(userInfomation, env.ACCESS_TOKEN_SECRET, env.ACCESS_TOKEN_LIFE)

  // 4. Tạo refreshtoken JWT
  const refreshToken = await JwtProvider.generateToken(userInfomation, env.REFRESH_TOKEN_SECRET, env.REFRESH_TOKEN_LIFE)

  // Trả về info user (trừ password) + token
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userInfo } = existingUser // Loại bỏ field password
  return { user: userInfo, token: { accessToken, refreshToken } }
}

const adminLogin = async (data: LoginDTO) => {
  // 1. Tìm user
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  })
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Email hoặc mật khẩu không đúng')
  }

  if (user.role !== 'ADMIN') {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Admin access required')
  }

  await verifyPasswordAndHandleLogin(user, data.password)

  // 3. Tạo token JWT
  const userInfomation = { userId: user.id, email: user.email, role: user.role }
  const accessToken = await JwtProvider.generateToken(userInfomation, env.ACCESS_TOKEN_SECRET, env.ACCESS_TOKEN_LIFE)

  // 4. Tạo refreshtoken JWT
  const refreshToken = await JwtProvider.generateToken(userInfomation, env.REFRESH_TOKEN_SECRET, env.REFRESH_TOKEN_LIFE)

  // Trả về info user (trừ password) + token
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userInfo } = user // Loại bỏ field password
  return { user: userInfo, token: { accessToken, refreshToken } }
}

export const authService = {
  registerUser,
  login,
  adminLogin
}
