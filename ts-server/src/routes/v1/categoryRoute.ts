import express from 'express'
import { authMiddleware } from 'middlewares/authMiddleware.js'
import { multerUploadMiddleware } from 'middlewares/multerUploadMiddleware.js'
import { categoryController } from 'controllers/categoryController.js'
import { categoryValidator } from 'validators/categoryValidator.js'

const Router = express.Router()

Router.route('/')
  .get(categoryController.getAllCate)
  .post(
    authMiddleware.isAuthorize,
    authMiddleware.adminAuth,
    multerUploadMiddleware.upload.single('categoryImg'),
    categoryValidator.createCategory,
    categoryController.createCategory
  )

Router.route('/:id')
  .get(
    categoryValidator.checkCategoryId,
    categoryController.getCateById
  )
  .put(
    authMiddleware.isAuthorize,
    authMiddleware.adminAuth,
    multerUploadMiddleware.upload.single('categoryImg'),
    categoryValidator.updateCategory,
    categoryController.updateCategory
  )
  .delete(
    authMiddleware.isAuthorize,
    authMiddleware.adminAuth,
    categoryValidator.checkCategoryId,
    categoryController.deleteCategory
  )

export const categoryRoute = Router
