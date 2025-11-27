import { env } from 'config/environment.js'
import { prisma } from 'config/prisma.js'
import type { Request, Response, NextFunction } from 'express'
import { Role } from 'generated/prisma/enums.js'
import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from 'providers/JwtProvider.js'
import { CustomJwtPayload } from 'types/express.js'
import ApiError from 'utils/apiError.js'

// Middleware này có nhiệm vụ quan trọng là xác thực accressToken gửi lên từ phía FE có hợp lệ hay không
const isAuthorize = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  // Lấy accessToken từ cookie FE gửi lên
  const clientAccessToken = req.cookies?.accessToken

  if (!clientAccessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorize! Token not found!'))
    return
  }

  try {
    // B1: Giải mã accessToken xem nó có hợp lệ không
    const accessTokenDecoded = await JwtProvider.verifyToken(clientAccessToken, env.ACCESS_TOKEN_SECRET)

    // B2: Important!!! Nếu token hợp lệ, thì cần phải lưu thông tin giải mã được vào req.jwtDecoded, để sử dụng cho các tầng xử lí phía sau
    req.jwtDecoded = accessTokenDecoded as CustomJwtPayload

    // B3: Cho qua
    next()
  } catch (error) {
    const err = error as Error

    // Nếu accessToken hết hạn thì ta cần trả về 1 mã lỗi GONE - 410 cho phía FE biết để gọi API refreshToken
    if (err?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Need to refresh token.'))
      return
    }
    // Nếu accessToken không hợp lệ thì ta trả về mã 401 cho FE để gọi API Sign-out luôn
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
  }
}

// Middleware này kiểm tra user có phải là admin hay không
const adminAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Lấy thông tin đã giải mã từ bước isAuthorize
    const userDecoded = req.jwtDecoded

    if (!userDecoded) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
      return
    }

    // CHECK 1: Kiểm tra Role trong Token (Nhanh, đỡ tốn query DB)
    if (userDecoded.role !== Role.ADMIN) {
      next(new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền truy cập tài nguyên Admin!'))
      return
    }

    // CHECK 2 (KỸ TÍNH): Query DB để chắc chắn user này chưa bị hạ quyền hoặc bị xóa
    // (Nếu muốn hiệu năng cao nhất thì có thể bỏ bước này, tin tưởng vào Token)
    /*
    const user = await prisma.user.findUnique({ where: { id: userDecoded.userId } })
    if (!user || user.role !== 'ADMIN') {
      next(new ApiError(StatusCodes.FORBIDDEN, 'Access Denied!'))
      return
    }
    */

    next()
  } catch (error) {
    next(error)
  }
}

// Middleware này kiểm tra user có phải là user hay không
const userAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userDecoded = req.jwtDecoded
    if (!userDecoded) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized!'))
      return
    }

    // CHECK 1: Đảm bảo đúng là User (Admin cũng là User nên có thể cho qua, tùy logic đại ca)
    // Nếu chỉ muốn User thường mới được vào thì thêm: if (userDecoded.role !== 'USER') ...

    // CHECK 2: Kiểm tra User có bị Ban (isActive) hay chưa Verify email không?
    // Bước này NÊN query DB vì trạng thái Active/Ban thay đổi liên tục, Token có thể cũ.
    const user = await prisma.user.findUnique({
      where: { id: userDecoded.userId },
      select: { isActive: true, verified: true } // Chỉ select cái cần check
    })

    if (!user) {
      next(new ApiError(StatusCodes.NOT_FOUND, 'User không tồn tại!'))
      return
    }

    // Check trạng thái
    if (!user.isActive) {
      next(new ApiError(StatusCodes.FORBIDDEN, 'Tài khoản của bạn đã bị khóa!'))
      return
    }

    // Nếu đại ca bắt buộc phải verify email mới được mua hàng
    // if (!user.verified) {
    //   next(new ApiError(StatusCodes.FORBIDDEN, 'Vui lòng xác thực email trước khi thực hiện thao tác này!'))
    //   return
    // }

    next()
  } catch (error) {
    next(error)
  }
}

export const authMiddleware = {
  isAuthorize,
  adminAuth,
  userAuth
}
