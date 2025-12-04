import { ghn } from 'config/Giaohangnhanh.js'
import { Request, Response, NextFunction } from 'express'

// Lấy danh sách Tỉnh/Thành
const getProvinces = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provinces = await ghn.address.getProvinces()
    res.status(200).json({
      success: true,
      data: provinces
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách Quận/Huyện (Query: ?province_id=...)
const getDistricts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const provinceId = Number(req.query.province_id)
    if (!provinceId) {
      res.status(400).json({ success: false, message: 'Thiếu province_id' })
      return
    }

    const districts = await ghn.address.getDistricts(provinceId)
    res.status(200).json({
      success: true,
      data: districts
    })
  } catch (error) {
    next(error)
  }
}

// Lấy danh sách Phường/Xã (Query: ?district_id=...)
const getWards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const districtId = Number(req.query.district_id)
    if (!districtId) {
      res.status(400).json({ success: false, message: 'Thiếu district_id' })
      return
    }

    const wards = await ghn.address.getWards(districtId)
    res.status(200).json({
      success: true,
      data: wards
    })
  } catch (error) {
    next(error)
  }
}

export const addressController = {
  getDistricts,
  getProvinces,
  getWards
}
