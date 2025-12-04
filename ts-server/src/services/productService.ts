import { CreateProductDTO, UpdateProductDTO } from 'types/IProduct.js'
import { prisma } from '../config/prisma.js'
import { CloudinaryProvider } from '../providers/CloudinaryProvider.js'
import ApiError from '../utils/apiError.js'
import { StatusCodes } from 'http-status-codes'
import { Prisma } from 'generated/prisma/client.js'
import { UUID } from 'crypto'

// ADD PRODUCT
const addProduct = async (data: CreateProductDTO, files: Express.Multer.File[]) => {
  // Check trùng tên (Optional)
  const existing = await prisma.product.findFirst({ where: { name: data.name } })
  if (existing) throw new ApiError(StatusCodes.CONFLICT, 'Product name already exists')

  // Upload nhiều ảnh lên Cloud
  // Folder: 'products'
  const imageUrls = await CloudinaryProvider.uploadMultiple(files, 'eSpecialty/products')

  // Xử lý Tags: Nếu gửi lên là chuỗi "tag1, tag2" thì split ra, nếu là mảng thì giữ nguyên
  // Vì form-data đôi khi gửi mảng rất dị
  let formattedTags: string[] = []
  if (typeof data.tags === 'string') {
    formattedTags = [data.tags]
  } else if (Array.isArray(data.tags)) {
    formattedTags = data.tags
  }

  // Convert các kiểu dữ liệu Boolean/Number từ string (do FormData gửi lên là string)
  // Lưu ý: Nếu dùng thư viện validate xịn nó tự convert, nhưng cứ ép kiểu thủ công cho chắc
  const newProduct = await prisma.product.create({
    data: {
      ...data,
      type: data.type || '',
      price: Number(data.price), // Ép kiểu Decimal
      stock: Number(data.stock || 0),
      discountedPercentage: Number(data.discountedPercentage || 10),
      weight: Number(data.weight || 500),
      isAvailable: data.isAvailable ? String(data.isAvailable) === 'true' : true,
      offer: Boolean(data.offer),
      badge: Boolean(data.badge),
      tags: formattedTags,
      images: imageUrls // Lưu mảng link ảnh
    }
  })

  return newProduct
}

const getAllProduct = async (query: { type?: string, categoryId?: UUID }) => {
  const { type, categoryId } = query

  // 1. Khởi tạo điều kiện lọc
  const whereCondition: Prisma.ProductWhereInput = {
    isAvailable: true // (Optional) Mặc định chỉ lấy sản phẩm đang bán
  }

  // 2. Nếu có type gửi lên thì thêm vào điều kiện lọc
  if (type) {
    whereCondition.type = type
  } else if (categoryId) {
    whereCondition.categoryId = categoryId
  }

  // 3. Query DB
  const data = await prisma.product.findMany({
    where: whereCondition,
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } }
    }
  })

  // 4. Map dữ liệu trả về (Flatten categoryName, brandName)
  return data.map(p => ({
    ...p,
    categoryName: p.category?.name,
    brandName: p.brand?.name
  }))
}

// GET BY ID
const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true, // Lấy chi tiết Cate
      brand: true // Lấy chi tiết Brand
    }
  })
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found')
  return product
}

// REMOVE PRODUCT
const removeProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found')

  // Check ràng buộc: Không xóa nếu sản phẩm đã có trong đơn hàng
  const orderCount = await prisma.orderItem.count({ where: { productId: id } })
  if (orderCount > 0) {
    // Soft delete (ẩn đi) thay vì xóa thật nếu đã bán được hàng
    return await prisma.product.update({
      where: { id },
      data: { isAvailable: false }
    })
  }

  // Nếu chưa bán được cái nào -> Xóa ảnh Cloudinary -> Xóa DB
  if (product.images && product.images.length > 0) {
    // Xóa từng ảnh (Loop)
    for (const img of product.images) {
      await CloudinaryProvider.deleteImage(img)
    }
  }

  await prisma.product.delete({ where: { id } })
  return { message: 'Product deleted successfully' }
}

// UPDATE PRODUCT (Full Update)
const updateProduct = async (id: string, data: UpdateProductDTO, files?: Express.Multer.File[]) => {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found')

  let newImages = product.images

  // Nếu có upload ảnh mới -> Thay thế ảnh cũ (Hoặc logic append tùy đại ca)
  // Logic: Có ảnh mới -> Xóa hết ảnh cũ -> Lưu ảnh mới
  if (files && files.length > 0) {
    // 1. Xóa ảnh cũ trên Cloud
    for (const img of product.images) {
      await CloudinaryProvider.deleteImage(img)
    }
    // 2. Up ảnh mới
    newImages = await CloudinaryProvider.uploadMultiple(files, 'eSpecialty/products')
  }

  // Xử lý tag và ép kiểu số tương tự create...
  let formattedTags = product.tags
  if (data.tags) {
    formattedTags = Array.isArray(data.tags) ? data.tags : [data.tags]
  }

  return await prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      description: data.description,

      // Number fields
      price: data.price ? Number(data.price) : undefined,
      stock: data.stock ? Number(data.stock) : undefined,
      discountedPercentage: data.discountedPercentage ? Number(data.discountedPercentage) : undefined,
      weight: data.weight ? Number(data.weight) : undefined,

      // Boolean fields (FormData luôn là string)
      offer: Boolean(data.offer),
      isAvailable: Boolean(data.isAvailable),
      badge: Boolean(data.badge),

      // Relation fields
      brandId: data.brandId,
      categoryId: data.categoryId,

      images: newImages,
      tags: formattedTags
    }
  })
}

// UPDATE STOCK ONLY
const updateStockById = async (id: string, stock: number) => {
  // Check tồn tại
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found')

  return await prisma.product.update({
    where: { id },
    data: { stock: Number(stock) }
  })
}

export const productService = {
  addProduct,
  getAllProduct,
  getProductById,
  removeProduct,
  updateProduct,
  updateStockById
}
