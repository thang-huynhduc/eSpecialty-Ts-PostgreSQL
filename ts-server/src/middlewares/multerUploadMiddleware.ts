import multer, { FileFilterCallback } from 'multer'
import type { Request } from 'express'
import { ALLOW_COMMON_TYPE_FILE, LITMIT_COMMON_FILE_SIZE } from 'utils/validators.js'

// Docx multer: https://www.npmjs.com/package/multer

// Function kiểm tra loại file nào được chấp nhập
const customfileFilter = (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
  // Đối với multer, kiểm tra kiểu file thì xử dụng mimetype
  if (!ALLOW_COMMON_TYPE_FILE.includes(file.mimetype)) {
    const errorMessage = new Error('File Type is not Valid. Only accept jpg, jpeg and png.')
    return callback(errorMessage)
  }
  // Nếu file hợp lên
  return callback(null, true)
}

// Khởi tạo function upload được bọc bởi multer
const upload = multer({
  limits: { fileSize: LITMIT_COMMON_FILE_SIZE },
  fileFilter: customfileFilter,
  storage: multer.memoryStorage()
})

export const multerUploadMiddleware = { upload }
