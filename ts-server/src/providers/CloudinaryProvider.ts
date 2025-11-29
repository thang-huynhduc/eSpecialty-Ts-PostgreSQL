import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary'
import { env } from '../config/environment.js' // Check lại đường dẫn
import streamifier from 'streamifier'

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
})

/**
 * Upload file từ Buffer lên Cloudinary (Dùng cho Multer MemoryStorage)
 * @param fileBuffer Dữ liệu file dạng Buffer
 * @param folderName Tên folder trên Cloudinary
 */
const streamUpload = (fileBuffer: Buffer, folderName: string): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    // Tạo luồng upload lên Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (result) {
          resolve(result)
        } else {
          reject(error)
        }
      }
    )

    // Dùng streamifier để biến Buffer thành Stream và pipe vào Cloudinary
    streamifier.createReadStream(fileBuffer).pipe(stream)
  })
}

const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // B1: Phân tích URL để lấy public_id
    // URL mẫu: https://res.cloudinary.com/demo/image/upload/v12345678/brands/my-brand.jpg
    // Regex này sẽ lấy phần nằm sau chữ "upload/" (bỏ qua version v123...) và trước dấu chấm đuôi file
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/
    const match = imageUrl.match(regex)

    // Nếu không khớp regex (ví dụ ảnh local hoặc ảnh link bậy bạ) thì bỏ qua
    if (!match) {
      // eslint-disable-next-line no-console
      console.log('Không tìm thấy public_id hợp lệ từ URL, bỏ qua xóa ảnh.')
      return
    }

    const publicId = match[1] // Kết quả: "brands/my-brand"

    // B2: Gọi API xóa
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    // Lưu ý: Việc xóa ảnh cũ thất bại KHÔNG NÊN làm sập luồng chính (Update Brand).
    // Nên ta chỉ log lỗi ra để biết thôi.
    // eslint-disable-next-line no-console
    console.error('Lỗi khi xóa ảnh trên Cloudinary:', error)
  }
}

/** Upload Nhiều file */
const uploadMultiple = async (files: Express.Multer.File[], folder: string): Promise<string[]> => {
  // Dùng Promise.all để chạy song song, upload 4 ảnh chỉ tốn thời gian bằng upload 1 ảnh chậm nhất
  const uploadPromises = files.map(file => streamUpload(file.buffer, folder))

  const results = await Promise.all(uploadPromises)

  // Trả về mảng các đường link ảnh
  return results.map(res => res.secure_url)
}

export const CloudinaryProvider = {
  streamUpload,
  deleteImage,
  uploadMultiple
}
