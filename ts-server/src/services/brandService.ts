import { CreateAndUpdateBrandDTO } from 'dtos/brandDTO.js'
import { prisma } from '../config/prisma.js'
import ApiError from '../utils/apiError.js'
import { StatusCodes } from 'http-status-codes'
import { CloudinaryProvider } from 'providers/CloudinaryProvider.js'

const createNew = async (data: CreateAndUpdateBrandDTO, brandImgFile: Express.Multer.File | undefined) => {
  // 1. Kiểm tra trùng tên Brand
  const existingBrand = await prisma.brand.findUnique({
    where: { name: data.name }
  })

  if (existingBrand) {
    throw new ApiError(StatusCodes.CONFLICT, 'Brand name already exists!')
  }

  let brandImgUrl = ''
  if (brandImgFile) {
    const result = await CloudinaryProvider.streamUpload(brandImgFile.buffer, 'brands')
    brandImgUrl = result.secure_url
  }

  // 2. Tạo Brand mới
  const newBrand = await prisma.brand.create({
    data: {
      name: data.name,
      image: brandImgUrl || '',
      description: data.description,
      website: data.website,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    }
  })

  return newBrand
}

const updateBrand = async (id: string, data: CreateAndUpdateBrandDTO, file?: Express.Multer.File) => {
  // B1: Check xem Brand cần sửa có tồn tại không
  const existingBrand = await prisma.brand.findUnique({
    where: { id }
  })

  if (!existingBrand) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Brand not found')
  }

  // B2: Nếu user có ý định đổi tên (data.name tồn tại và khác tên cũ)
  // Phải check xem tên mới này có bị ai khác dùng chưa
  if (data.name && data.name !== existingBrand.name) {
    const duplicateName = await prisma.brand.findUnique({
      where: { name: data.name }
    })

    // Nếu tìm thấy thằng trùng tên, mà ID thằng đó KHÁC ID thằng đang sửa -> Lỗi
    if (duplicateName && duplicateName.id !== id) {
      throw new ApiError(StatusCodes.CONFLICT, 'Brand name already taken by another brand!')
    }
  }

  // B3: Xử lý file ảnh (Nếu có file mới -> Upload -> Lấy link mới. Không thì dùng link cũ)
  let imageUrl = existingBrand.image // Mặc định giữ ảnh cũ

  if (file) {
    // Upload ảnh mới lên Cloudinary (dùng streamUpload vì đại ca đang dùng MemoryStorage)
    const uploadResult = await CloudinaryProvider.streamUpload(file.buffer, 'brands')
    imageUrl = uploadResult.secure_url

    // (Xóa ảnh cũ trên Cloudinary đi cho đỡ rác public_id cũ
    await CloudinaryProvider.deleteImage(existingBrand.image)
  }

  // B4: Update vào DB
  const updatedBrand = await prisma.brand.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      website: data.website,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined, // Chỉ update nếu có gửi lên
      image: imageUrl // Link mới hoặc link cũ
    }
  })

  return updatedBrand
}

const deleteBrand = async (brandId: string) => {
  // B1: Tìm Brand
  const existingBrand = await prisma.brand.findUnique({
    where: { id: brandId }
  })

  if (!existingBrand) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Brand not found')
  }

  // B2: QUAN TRỌNG - Kiểm tra xem Brand này có sản phẩm nào không
  // Nếu có sản phẩm thì không cho xóa (để bảo vệ dữ liệu toàn vẹn)
  const productCount = await prisma.product.count({
    where: { brandId: brandId }
  })

  if (productCount > 0) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `Cannot delete this brand because it has ${productCount} associated products. Please delete or reassign products first.`
    )
  }

  // B3: Xóa ảnh trên Cloudinary (nếu có)
  if (existingBrand.image) {
    await CloudinaryProvider.deleteImage(existingBrand.image)
  }

  // B4: Xóa trong DB
  await prisma.brand.delete({
    where: { id: brandId }
  })

  return { message: 'Brand deleted successfully' }
}

// Lấy danh sách (GET ALL)
const getAllBrands = async () => {
  const brands = await prisma.brand.findMany({
    // Sắp xếp: Mới tạo nằm trên cùng
    orderBy: { createdAt: 'desc' }
    // Nếu muốn lấy kèm sản phẩm của brand đó thì mở comment dòng dưới
    // include: { products: true }
  })
  return brands
}

// Lấy chi tiết (GET BY ID)
const getBrandById = async (id: string) => {
  const brand = await prisma.brand.findUnique({
    where: { id }
    // include: { products: true } // Lấy luôn danh sách sản phẩm thuộc brand này nếu cần
  })

  if (!brand) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Brand not found')
  }

  return brand
}

export const brandService = {
  createNew,
  updateBrand,
  deleteBrand,
  getAllBrands,
  getBrandById
}
