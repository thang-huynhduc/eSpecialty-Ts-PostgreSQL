import { CreateOrderDTO, OrderItemDTO } from 'types/IOrder.js'
import { prisma } from '../config/prisma.js'
import ApiError from '../utils/apiError.js'
import { StatusCodes } from 'http-status-codes'
import { OrderStatus, PaymentStatus } from 'generated/prisma/enums.js'

// 1. TẠO ĐƠN HÀNG (Transaction)
const createOrder = async (userId: string, data: CreateOrderDTO) => {
  // B1: Lấy thông tin các sản phẩm từ DB để check giá và tồn kho
  // (Không tin giá từ FE gửi lên)
  const productIds = data.items.map(item => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } }
  })

  // Map để tra cứu nhanh
  const productMap = new Map(products.map(p => [p.id, p]))

  let totalAmount = 0
  const orderItemsData: OrderItemDTO[] = []

  // B2: Loop qua từng item để tính toán
  for (const item of data.items) {
    const product = productMap.get(item.productId)

    if (!product) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Sản phẩm với ID ${item.productId} không tồn tại`)
    }

    // Check tồn kho
    if (product.stock < item.quantity) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Sản phẩm "${product.name}" đã hết hàng hoặc không đủ số lượng`)
    }

    if (!product.isAvailable) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Sản phẩm "${product.name}" đang ngừng kinh doanh`)
    }

    // Tính giá (Snapshot giá tại thời điểm mua)
    // Giá = Giá gốc * số lượng (Nếu có logic giảm giá thì tính vào đây)
    const price = Number(product.price) // Decimal -> Number
    totalAmount += price * item.quantity

    // Chuẩn bị data để insert vào bảng OrderItem
    orderItemsData.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price, // Prisma chấp nhận cả Decimal lẫn Number ở đây
      name: product.name,
      image: product.images[0] || '',
      weight: product.weight
    })
  }

  // Cộng phí ship
  // totalAmount += Number(data.shippingFee || 0)

  // B3: CHẠY TRANSACTION (Tạo đơn + Trừ kho)
  // Dùng $transaction để đảm bảo tính toàn vẹn dữ liệu
  const newOrder = await prisma.$transaction(async (tx) => {
    // 3.1. Trừ tồn kho của từng sản phẩm
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity }, // Trừ đi
          soldQuantity: { increment: item.quantity } // Cộng số lượng đã bán
        }
      })
    }

    // 3.2. Tạo Order và OrderItems
    const order = await tx.order.create({
      data: {
        userId: userId,
        amount: totalAmount,
        shippingFee: data.shippingFee || 0,
        shippingAddress: data.shippingAddress, // Lưu JSON snapshot
        paymentMethod: data.paymentMethod,
        status: OrderStatus.pending,
        // Prisma hỗ trợ tạo luôn bảng con (Items) ngay trong lệnh này
        items: {
          create: orderItemsData
        }
      },
      include: { items: true } // Trả về kèm items
    })

    return order
  })

  return newOrder
}

// 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA USER
const getAllUserOrders = async (userId: string) => {
  return await prisma.order.findMany({
    where: { userId },
    include: {
      items: true // Lấy kèm chi tiết sản phẩm
    },
    orderBy: { createdAt: 'desc' } // Đơn mới nhất lên đầu
  })
}

// 3. LẤY CHI TIẾT ĐƠN HÀNG
const getOrderById = async (userId: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, paymentDetail: true, user: { select: { name: true, email: true } } }
  })

  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found')

  // Security: Check xem đơn này có phải của user đang login không
  if (order.userId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Bạn không có quyền xem đơn hàng này')
  }

  return order
}

// 4. HỦY ĐƠN HÀNG
const cancelOrder = async (userId: string, orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  })

  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found')
  if (order.userId !== userId) throw new ApiError(StatusCodes.FORBIDDEN, 'Permission denied')

  // Chỉ cho hủy khi đơn đang pending hoặc confirmed. Đã ship (shipped) thì không cho hủy.
  if (order.status !== 'pending' && order.status !== 'confirmed') {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Không thể hủy đơn hàng đang ở trạng thái "${order.status}"`)
  }

  // Transaction: Update trạng thái + Hoàn trả tồn kho
  await prisma.$transaction(async (tx) => {
    // 4.1 Update status
    await tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.cancelled, paymentStatus: PaymentStatus.failed }
    })

    // 4.2 Hoàn trả tồn kho (Loop qua items để cộng lại)
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: item.quantity }, // Cộng lại kho
          soldQuantity: { decrement: item.quantity } // Trừ đi số lượng bán
        }
      })
    }
  })

  return { message: 'Order cancelled successfully' }
}

// 5. [ADMIN] LẤY TẤT CẢ ĐƠN HÀNG (Có phân trang nếu thích, ở đây em làm basic trước)
const getAllOrders = async () => {
  return await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { // Lấy thông tin người mua để Admin biết
        select: { id: true, name: true, email: true } // Chỉ lấy field cần thiết
      },
      items: true
    }
  })
}

// 6. [ADMIN] LẤY ĐƠN HÀNG CỦA 1 USER CỤ THỂ
const getOrdersByUserId = async (userId: string) => {
  // Check user tồn tại
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')

  return await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  })
}

// 7. [ADMIN] CẬP NHẬT TRẠNG THÁI
const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found')

  // Nếu Admin chuyển trạng thái thành "Cancelled"
  // -> Ta tái sử dụng logic của hàm cancelOrder ở trên để HOÀN TRẢ TỒN KHO
  if (status === OrderStatus.cancelled) {
    // Gọi lại hàm cancelOrder (nhưng cần sửa hàm cancelOrder một chút để bỏ check userId nếu là admin gọi)
    // Cách nhanh nhất: Viết logic hoàn kho riêng ở đây hoặc gọi hàm cancelOrder với userId của chủ đơn
    return await cancelOrder(order.userId, orderId)
  }

  // Các trạng thái khác (Confirmed, Shipped, Delivered...) -> Update bình thường
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status }
  })

  return updatedOrder
}

// 8. [ADMIN] XÓA ĐƠN HÀNG (Hard Delete)
const deleteOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found')

  // Rule an toàn: Không cho xóa đơn đã hoàn thành hoặc đang giao (trừ khi Admin cố tình)
  // Chỉ nên xóa đơn Pending hoặc Cancelled để tránh sai lệch doanh thu
  if (order.status === 'shipped' || order.status === 'delivered') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot delete active order. Cancel it first.')
  }

  // Xóa DB (Prisma sẽ tự Cascade xóa OrderItems và PaymentDetails nếu cấu hình schema đúng)
  await prisma.order.delete({
    where: { id: orderId }
  })

  return { message: 'Order deleted permanently' }
}

export const orderService = {
  createOrder,
  getAllUserOrders,
  getOrderById,
  cancelOrder,
  // Admin functions
  getAllOrders,
  getOrdersByUserId,
  updateOrderStatus,
  deleteOrder
}
