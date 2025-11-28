import { brandController } from 'controllers/brandController.js'
import express from 'express'
import { authMiddleware } from 'middlewares/authMiddleware.js'
import { multerUploadMiddleware } from 'middlewares/multerUploadMiddleware.js'
import { brandValidator } from 'validators/brandValidator.js'

const Router = express.Router()
// /api/brand

Router.route('/')
  .get(brandController.getAllBrands) // Lấy tất cả danh sách brand
  .post(authMiddleware.isAuthorize, authMiddleware.adminAuth, multerUploadMiddleware.upload.single('brandImage'), brandValidator.createBrand, brandController.createBrand) // Tạo brand mới

Router.route('/:id')
  .get(brandController.getBrandById)
  .put(authMiddleware.isAuthorize, authMiddleware.adminAuth, multerUploadMiddleware.upload.single('brandImage'), brandValidator.updateBrand, brandController.updateBrand)
  .delete(authMiddleware.isAuthorize, authMiddleware.adminAuth, brandValidator.checkBrandId, brandController.deleteBrand)

export const brandRoute = Router
