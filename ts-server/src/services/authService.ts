import bcrypt from 'bcryptjs'
import { env } from 'config/environment.js'
import { prisma } from 'config/prisma.js'
import { LoginDTO, RegisterDTO } from 'dtos/authDTO.js'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from 'providers/JwtProvider.js'
import ApiError from 'utils/apiError.js'

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
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  })
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Email hoặc mật khẩu không đúng')
  }

  // 2. So sánh password
  const isMatch = await bcrypt.compare(data.password, user.password)
  if (!isMatch) {
    throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Email hoặc mật khẩu không đúng')
  }

  // 3. Tạo token JWT
  const userInfomation = { userId: user.id, email: user.email, role: user.role }
  const accessToken = await JwtProvider.generateToken(userInfomation, env.ACCESS_TOKEN_SECRET, env.ACCESS_TOKEN_LIFE)

  // 4. Tạo refreshtoken JWT
  const refreshToken = await JwtProvider.generateToken(userInfomation, env.REFRESH_TOKEN_SECRET, env.REFRESH_TOKEN_LIFE)

  // Trả về info user (trừ password) + token
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userInfo } = user // Loại bỏ field password
  return { user: userInfo, accessToken, refreshToken }
}

export const authService = {
  registerUser,
  login
}
