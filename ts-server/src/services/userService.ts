import bcrypt from 'bcryptjs'
import { env } from 'config/environment.js'
import { prisma } from 'config/prisma.js'
import { LoginDTO, RegisterDTO, SendOtpDTO, VerifyOtpDTO } from 'dtos/authDTO.js'
import { User } from 'generated/prisma/client.js'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from 'providers/JwtProvider.js'
import ApiError from 'utils/apiError.js'
import { LOCK_TIME, MAX_FAILED_ATTEMPTS, OTP_EXPIRATION_MINUTES } from 'utils/constants.js'
import { generateNumericOTP } from 'utils/generators.js'

/** Auth */
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
        lockUntil: null, // Mở khóa
        lastLogin: new Date() // Cập nhật thời gian login
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

/** OTP */
export const sendOtp = async (data: SendOtpDTO) => {
  // B1: Tìm User xem có tồn tại không
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  })

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Email không tồn tại trong hệ thống')
  }

  // B2: Xóa OTP cũ (nếu có) của user này với type này để tránh rác
  await prisma.otp.deleteMany({
    where: { userId: user.id, type: data.type }
  })

  // B3: Sinh OTP và Hash
  const plainOtp = generateNumericOTP(6)
  const otpHash = await bcrypt.hash(plainOtp, 10)
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000)

  // B4: Lưu vào DB
  await prisma.otp.create({
    data: {
      userId: user.id,
      otpHash,
      type: data.type,
      expiresAt
    }
  })

  // B5: Gửi Email (Đoạn này đại ca tích hợp Nodemailer sau)
  console.log(`[MOCK EMAIL SERVICE] Gửi OTP: ${plainOtp} tới ${data.email}`)

  // Lưu ý: Service chỉ trả về thông báo hoặc kết quả, KHÔNG trả plainOtp về controller (bảo mật)
  return { message: 'OTP sent successfully' }
}

// Xác thực OTP
export const verifyOtp = async (data: VerifyOtpDTO) => {
  // B1: Tìm User
  const user = await prisma.user.findUnique({
    where: { email: data.email }
  })
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')

  // B2: Tìm bản ghi OTP
  const otpRecord = await prisma.otp.findFirst({
    where: { userId: user.id, type: data.type },
    orderBy: { createdAt: 'desc' } // Lấy cái mới nhất
  })

  if (!otpRecord) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP không tồn tại hoặc đã hết hạn')
  }

  // B3: Check hết hạn
  if (new Date() > otpRecord.expiresAt) {
    await prisma.otp.delete({ where: { id: otpRecord.id } }) // Dọn dẹp
    throw new ApiError(StatusCodes.BAD_REQUEST, 'OTP đã hết hạn')
  }

  // B4: So khớp Hash
  const isValid = await bcrypt.compare(data.otp, otpRecord.otpHash)
  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã OTP không chính xác')
  }

  // B5: Nếu đúng -> Xóa OTP ngay (One-time usage)
  await prisma.otp.delete({ where: { id: otpRecord.id } })

  // B6: Xử lý nghiệp vụ sau khi verify thành công (Ví dụ: kích hoạt tài khoản)
  if (data.type === 'REGISTER') {
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true, verified: true }
    })
  }

  return { verified: true }
}

/** Profile */
export const getUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // JOIN bảng addresses
    include: {
      addresses: {
        orderBy: { isDefault: 'desc' }
      },
      // JOIN bảng Order
      orders: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User không tồn tại')
  }
  // Xử lý logic lấy địa chỉ chính (để map vào phone và address)
  // Vì ta đã sort ở trên, nên phần tử [0] chính là địa chỉ mặc định (nếu có)
  const primaryAddress = user.addresses[0] || null

  // Transform dữ liệu (Map sang format đại ca muốn)
  const userProfile = {
    id: user.id, // PostgreSQL dùng 'id', không phải '_id'
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,

    // Logic: Lấy từ địa chỉ đầu tiên, nếu không có thì trả về rỗng ""
    phone: primaryAddress?.phone || '',
    address: primaryAddress?.street || '', // Map street vào field 'address'

    // Trả về nguyên mảng relation
    addresses: user.addresses,
    orders: user.orders
  }

  return userProfile
}

export const userService = {
  registerUser,
  login,
  adminLogin,
  sendOtp,
  verifyOtp,
  getUserProfile
}
