import { prisma } from '../config/prisma.js'
import { CreateCategoryDTO, UpdateCategoryDTO } from 'dtos/categoriesDTO.js'
import ApiError from '../utils/apiError.js'
import { StatusCodes } from 'http-status-codes'
import { CloudinaryProvider } from '../providers/CloudinaryProvider.js'

// Tạo mới
const createNew = async (data: CreateCategoryDTO, file: Express.Multer.File | undefined) => {
  // Check trùng tên
  const existingCate = await prisma.category.findUnique({ where: { name: data.name } })
  if (existingCate) throw new ApiError(StatusCodes.CONFLICT, 'Category name already exists!')

  // Upload ảnh
  let imageUrl = ''
  if (file) {
    const result = await CloudinaryProvider.streamUpload(file.buffer, 'eSpecialty/categories')
    imageUrl = result.secure_url
  }

  return await prisma.category.create({
    data: {
      name: data.name,
      image: imageUrl || '',
      description: data.description,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    }
  })
}

// Update
const updateCategory = async (id: string, data: UpdateCategoryDTO, file?: Express.Multer.File) => {
  const existingCate = await prisma.category.findUnique({ where: { id } })
  if (!existingCate) throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found')

  // Check trùng tên nếu đổi tên
  if (data.name && data.name !== existingCate.name) {
    const duplicate = await prisma.category.findUnique({ where: { name: data.name } })
    if (duplicate && duplicate.id !== id) {
      throw new ApiError(StatusCodes.CONFLICT, 'Category name taken!')
    }
  }

  // Xử lý ảnh
  let imageUrl = existingCate.image
  if (file) {
    const uploadResult = await CloudinaryProvider.streamUpload(file.buffer, 'eSpecialty/categories')
    imageUrl = uploadResult.secure_url

    // Xóa ảnh cũ
    if (existingCate.image) await CloudinaryProvider.deleteImage(existingCate.image)
  }

  return await prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      image: imageUrl
    }
  })
}

// Delete (Có check ràng buộc)
const deleteCategory = async (id: string) => {
  const existingCate = await prisma.category.findUnique({ where: { id } })
  if (!existingCate) throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found')

  // KHÔNG CHO XÓA NẾU CÒN SẢN PHẨM
  const productCount = await prisma.product.count({ where: { categoryId: id } })
  if (productCount > 0) {
    throw new ApiError(StatusCodes.CONFLICT, `Cannot delete category containing ${productCount} products.`)
  }

  // Xóa ảnh trên Cloud
  if (existingCate.image) await CloudinaryProvider.deleteImage(existingCate.image)

  // Xóa DB
  await prisma.category.delete({ where: { id } })
  return { message: 'Category deleted successfully' }
}

// Get All
const getAllCategories = async () => {
  return await prisma.category.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

// Get By ID
const getCategoryById = async (id: string) => {
  const cate = await prisma.category.findUnique({ where: { id } })
  if (!cate) throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found')
  return cate
}

export const categoryService = {
  createNew,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById
}
