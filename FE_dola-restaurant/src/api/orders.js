import { apiClient } from './client'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'served']

const orderService = {
  create: async (tableCode, payload) => {
    const res = await apiClient.post('/orders/dine-in', {
      tableCode,
      ...payload,
    })
    return res.data
  },
  getById: async (orderId) => {
    const res = await apiClient.get(`/orders/${orderId}`)
    return res.data
  },
  getActiveByTable: async (tableCode) => {
    const res = await apiClient.get(`/orders/public/table/${tableCode}/active`)
    return res.data
  },
  // Khách bấm "Yêu cầu thanh toán" tại bàn — chỉ gửi thông báo cho nhân viên, không xử lý thanh toán
  requestPayment: async (orderId) => {
    const res = await apiClient.post(`/orders/${orderId}/request-payment`)
    return res.data
  },

  // Áp dụng mã khuyến mãi cho bàn
  // userId không gửi trong body — server lấy từ JWT Authorization header
  // (apiClient tự động đính kèm token nếu đã đăng nhập)
  applyVoucher: async (tableCode, voucherCode) => {
    const res = await apiClient.post('/orders/public/apply-voucher', {
      tableCode,
      voucherCode,
    })
    return res.data
  },

  // Hủy mã khuyến mãi tại bàn
  removeVoucher: async (tableCode) => {
    const res = await apiClient.post('/orders/public/remove-voucher', {
      tableCode,
    })
    return res.data
  },

  // ---- Dành cho Admin / Staff (OrdersManagement.jsx) ----

  // Lấy danh sách đơn đang hoạt động (chưa completed/cancelled) để hiển thị bảng quản lý.
  getActive: async () => {
    const res = await apiClient.get('/orders')
    return (res.data || []).filter((o) => ACTIVE_STATUSES.includes(o.status))
  },

  updateStatus: async (orderId, status) => {
    const res = await apiClient.patch(`/orders/${orderId}/status`, { status })
    return res.data
  },

  checkout: async (orderId, paymentMethod) => {
    const res = await apiClient.post(`/orders/${orderId}/checkout`, { paymentMethod })
    return res.data
  },
}

export default orderService