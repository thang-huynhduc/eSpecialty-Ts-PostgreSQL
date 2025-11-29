import { productController } from 'controllers/productController.js'
import express from 'express'
import { authMiddleware } from 'middlewares/authMiddleware.js'
import { multerUploadMiddleware } from 'middlewares/multerUploadMiddleware.js'
import { brandValidator } from 'validators/brandValidator.js'
import { productValidator } from 'validators/productValidator.js'

const Router = express.Router()
// /api/product

Router.route('/')
  .post(authMiddleware.isAuthorize, authMiddleware.isAuthorize, multerUploadMiddleware.upload.array('productImg', 4), productValidator.createProduct, productController.addProduct) // add Product

Router.route('/:id')
  .get(brandValidator.checkBrandId, productController.getProductById) // Check uuid ( Tái sử dụng), Lấy thông tin ProductId
  .delete(authMiddleware.isAuthorize, authMiddleware.adminAuth, brandValidator.checkBrandId, productController.removeProduct) // Remove soft product
  .put(authMiddleware.isAuthorize, authMiddleware.adminAuth, multerUploadMiddleware.upload.array('productImg', 4), productValidator.updateProduct, productController.updateProduct) // Upadte full product in4
  .patch(authMiddleware.isAuthorize, authMiddleware.adminAuth, productValidator.updateStock, productController.updateStockById) // Update Stock

export const productRoute = Router
