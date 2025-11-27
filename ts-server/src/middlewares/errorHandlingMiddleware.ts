import { Request, Response, NextFunction } from 'express'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import { env } from '../config/environment.js'
// Định nghĩa Interface cho Error để TS hiểu object err có những gì
// Có thể mở rộng thêm field 'errors' nếu dùng validate form
interface AppError extends Error {
  statusCode?: number
}

// Middleware xử lý lỗi tập trung
export const errorHandlingMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction // Quan trọng: Phải có đủ 4 tham số Express mới hiểu đây là Error Middleware
): void => {

  // Nếu thiếu statusCode thì mặc định là 500
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR

  // Tạo responseError
  const responseError: {
    statusCode: number
    message: string
    stack?: string
  } = {
    statusCode: statusCode,
    // Nếu không có message custom thì lấy message chuẩn HTTP (VD: "Internal Server Error")
    message: err.message || getReasonPhrase(statusCode),
    stack: err.stack
  }

  // console.log(responseError)

  // Chỉ khi môi trường là DEV thì mới trả về Stack Trace
  // console.log('Mode:', env.BUILD_MODE)
  if (env.BUILD_MODE !== 'dev') {
    delete responseError.stack
  }

  // Xử lý ghi log (Slack, Telegram, File...)
  // if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
  //    console.error(responseError)
  // }

  // Trả về phía Client
  res.status(responseError.statusCode).json(responseError)
}
