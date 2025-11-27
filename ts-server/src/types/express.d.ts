import { JwtPayload } from 'jsonwebtoken'

// Định nghĩa khuôn mẫu Token của dự án (Khớp với lúc generateToken)
interface CustomJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      // Thay thế type cũ bằng type này
      // Bỏ luôn "| string" vì logic app mình luôn sign object, ko bao giờ sign string
      jwtDecoded?: CustomJwtPayload;
    }
  }
}
