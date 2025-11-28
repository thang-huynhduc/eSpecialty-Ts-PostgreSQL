import type { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { brandService } from '../services/brandService.js'
import { CreateAndUpdateBrandDTO } from 'dtos/brandDTO.js'

const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandImgFile = req.file

    // Gọi Service tạo brand
    const newBrand = await brandService.createNew(req.body as CreateAndUpdateBrandDTO, brandImgFile)

    res.status(StatusCodes.CREATED).json({
      message: 'Create brand successfully',
      data: newBrand
    })
  } catch (error) {
    next(error)
  }
}

const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    // File có thể có hoặc không (undefined)
    const file = req.file

    // Gọi Service
    const updatedBrand = await brandService.updateBrand(id, req.body as CreateAndUpdateBrandDTO, file)

    res.status(StatusCodes.OK).json({
      message: 'Update brand successfully',
      data: updatedBrand
    })
  } catch (error) {
    next(error)
  }
}

const deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // Gọi Service
    const result = await brandService.deleteBrand(id)

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

// GET ALL
const getAllBrands = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await brandService.getAllBrands()
    res.status(StatusCodes.OK).json(brands)
  } catch (error) {
    next(error)
  }
}

// GET BY ID
const getBrandById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const brand = await brandService.getBrandById(id)
    res.status(StatusCodes.OK).json(brand)
  } catch (error) {
    next(error)
  }
}

export const brandController = {
  createBrand,
  updateBrand,
  deleteBrand,
  getAllBrands,
  getBrandById
}
