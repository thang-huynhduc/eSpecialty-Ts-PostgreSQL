import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { categoryService } from '../services/categoryService.js'
import { CreateCategoryDTO, UpdateCategoryDTO } from 'dtos/categoriesDTO.js'

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newCate = await categoryService.createNew(req.body as CreateCategoryDTO, req.file)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo Danh Mục Thành Công',
      categories: newCate
    })
  } catch (error) { next(error) }
}

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedCate = await categoryService.updateCategory(
      req.params.id,
      req.body as UpdateCategoryDTO,
      req.file
    )
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập Nhập Danh Mục Thành Công',
      categories: updatedCate
    })
  } catch (error) { next(error) }
}

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id)
    res.status(StatusCodes.OK).json({
      success: true,
      result: result
    })
  } catch (error) { next(error) }
}

const getAllCate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await categoryService.getAllCategories()
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lấy Danh Mục Thành Công',
      categories: list
    })
  } catch (error) { next(error) }
}

const getCateById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cate = await categoryService.getCategoryById(req.params.id)
    res.status(StatusCodes.OK).json(cate)
  } catch (error) { next(error) }
}

export const categoryController = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCate,
  getCateById
}
