import { ghn } from 'providers/GhnProvider.js'
import { Request, Response, NextFunction } from 'express'
import { prisma } from 'config/prisma.js'
import { GHN_STATUS_MAPPING } from 'utils/constants.js'

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


const handleGHNWebhook = async (req: Request, res: Response) => {
  try {
    const { OrderCode, Status, ExpectedDeliveryTime } = req.body

    if (!OrderCode) {
      return res.status(200).json({ success: true, message: 'Ignored: No OrderCode' })
    }

    // 1. Tìm đơn hàng trước xem có tồn tại không
    // Lưu ý: Trường trong DB mình đặt là 'trackingCode' hay 'ghnOrderCode' thì sửa cho khớp nhé
    const existingOrder = await prisma.order.findFirst({
      where: { ghnOrderCode: OrderCode }, // Sửa 'trackingCode' thành tên cột lưu mã vận đơn trong DB đại ca
      include: { user: true } // Lấy luôn user để gửi mail
    })

    if (!existingOrder) {
      // Vẫn trả về 200 để GHN không spam lại, nhưng log ra lỗi
      return res.status(200).json({ success: true, message: 'Order not found' })
    }

    // 2. Chuẩn bị dữ liệu update
    const newStatus = GHN_STATUS_MAPPING[Status]
    let newPaymentStatus = existingOrder.paymentStatus

    // Logic quan trọng: Nếu giao thành công -> Coi như đã trả tiền (cho đơn COD)
    if (Status === 'delivered' && existingOrder.paymentMethod === 'cod') {
      newPaymentStatus = 'paid'
    }

    // Xử lý ngày giao hàng dự kiến
    const updateData: any = {
      ghnStatus: Status,
      updatedAt: new Date()
    }

    if (ExpectedDeliveryTime) {
      updateData.ghnExpectedDeliveryTime = new Date(ExpectedDeliveryTime)
    }

    // Chỉ update status nếu map được (tránh null)
    if (newStatus) {
      updateData.status = newStatus
    }
    if (newPaymentStatus) {
      updateData.paymentStatus = newPaymentStatus
    }

    // 3. Thực hiện Update vào DB
    const updatedOrder = await prisma.order.update({
      where: { id: existingOrder.id },
      data: updateData
    })

    // 4. Gửi Email thông báo (Bọc try catch riêng để không ảnh hưởng luồng chính)
    // if (existingOrder.user && existingOrder.user.email) {
    //   try {
    //     const emailSubject = `Cập nhật đơn hàng #${updatedOrder.id} - ${newStatus?.toUpperCase()}`
    //     // Gọi hàm gửi mail của đại ca (không await để response nhanh hơn, hoặc await nếu muốn chắc chắn)
    //     sendOtpEmail(
    //       existingOrder.user.email,
    //       null,
    //       emailSubject,
    //       "order_status_update",
    //       {
    //         orderId: updatedOrder.id,
    //         status: updatedOrder.status,
    //         ghnStatus: Status,
    //         items: [], // Nếu cần items thì phải include ở query trên
    //         amount: Number(updatedOrder.amount), // Prisma trả về Decimal nên cần convert
    //         // ... map các field khác
    //       }
    //     ).catch(err => console.error("📧 Email send failed:", err))
    //   } catch (mailError) {
    //     console.error("📧 Email logic error:", mailError)
    //   }
    // }

    // 5. Trả về Response cho GHN
    return res.status(200).json({ success: true, message: 'Webhook processed' })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error: any) {
    // Vẫn return 200 để GHN không retry (nếu lỗi do code mình thì retry cũng vô ích)
    return res.status(200).json({ success: false, message: 'Internal Error handled' })
  }
}

export const GHNController = {
  getDistricts,
  getProvinces,
  getWards,
  handleGHNWebhook
}
