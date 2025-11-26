import JWT, { SignOptions, JwtPayload } from 'jsonwebtoken'

/**
 * Func tạo ra Token - cần 3 tham số đầu vào:
 * @param userInfo - Payload: Những thông tin muốn đính kèm vào token (Object)
 * @param secretSignature - Chữ ký bí mật (privateKey)
 * @param tokenLife - Thời gian sống của token (VD: '1h', '7d', hoặc số giây)
 * @returns Promise<string> - Trả về chuỗi Token đã được ký
 */
const generateToken = async (
  userInfo: object,
  secretSignature: string,
  tokenLife: string | number
): Promise<string> => {
  try {
    // Tùy chọn cho việc ký token
    const signOptions: SignOptions = {
      algorithm: 'HS256',
      // Ép kiểu tokenLife thành kiểu dữ liệu mà SignOptions mong muốn
      expiresIn: tokenLife as SignOptions['expiresIn']
    }

    // Hàm sign của thư viện JWT (đồng bộ), nhưng ta bọc trong async để trả về Promise
    // giúp đồng bộ hóa luồng code nếu sau này đại ca chuyển sang thư viện bất đồng bộ khác.
    return JWT.sign(userInfo, secretSignature, signOptions)
  } catch (error) {
    // Ném lỗi ra ngoài để tầng Service/Controller xử lý
    throw new Error(`Error generating token: ${(error as Error).message}`)
  }
}

/**
 * Func kiểm tra xem token có hợp lệ hay không
 * @param token - Chuỗi token cần kiểm tra
 * @param secretSignature - Chữ ký bí mật dùng để verify
 * @returns Promise<string | JwtPayload> - Trả về payload giải mã được nếu hợp lệ
 */
const verifyToken = async (
  token: string,
  secretSignature: string
): Promise<string | JwtPayload> => {
  try {
    // Hàm verify kiểm tra tính hợp lệ của token
    return JWT.verify(token, secretSignature) as string | JwtPayload
  } catch (error) {
    // Ném lỗi cụ thể (ví dụ: TokenExpiredError) để bên ngoài bắt được
    throw new Error(`Error verifying token: ${(error as Error).message}`)
  }
}

// Export object chứa các method để gọi gọn gàng: JwtProvider.generateToken(...)
export const JwtProvider = {
  generateToken,
  verifyToken
}
