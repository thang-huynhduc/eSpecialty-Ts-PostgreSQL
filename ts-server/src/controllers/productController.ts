import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { productService } from '../services/productService.js'
import ApiError from '../utils/apiError.js'

const addProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) throw new ApiError(StatusCodes.BAD_REQUEST, 'Images required')

    // Multer giới hạn 4 file, nhưng check thêm ở đây cho chắc
    if (files.length > 4) throw new ApiError(StatusCodes.BAD_REQUEST, 'Max 4 images allowed')

    const result = await productService.addProduct(req.body, files)
    res.status(StatusCodes.CREATED).json(result)
  } catch (error) { next(error) }
}

const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productService.getProductById(req.params.id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const removeProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await productService.removeProduct(req.params.id)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[] || []
    const result = await productService.updateProduct(req.params.id, req.body, files)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const updateStockById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stock } = req.body
    const result = await productService.updateStockById(req.params.id, stock)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const productController = {
  addProduct,
  getProductById,
  removeProduct,
  updateProduct,
  updateStockById
}
