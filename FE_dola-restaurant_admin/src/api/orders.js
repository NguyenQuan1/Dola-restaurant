import { apiClient } from './client.js'

const ordersService = {
  getAll: async (params = {}) => {
    const res = await apiClient.get('/orders', { params })
    return res.data
  },
  getActive: async () => {
    const res = await apiClient.get('/orders', {
      params: { status: 'pending,confirmed,preparing,served' },
    })
    return res.data
  },
  getByTable: async (code) => {
    const res = await apiClient.get('/orders', { params: { tableCode: code } })
    return res.data
  },
  getById: async (id) => {
    const res = await apiClient.get(`/orders/${id}`)
    return res.data
  },
  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/orders/${id}/status`, { status })
    return res.data
  },
  // Hủy một món trong đơn hàng
  cancelOrderItem: async (orderId, itemId, reason) => {
    const res = await apiClient.patch(`/orders/${orderId}/items/${itemId}/cancel`, { reason })
    return res.data
  },
  // Áp dụng mã khuyến mãi cho đơn hàng
  applyVoucher: async (id, voucherCode) => {
    const res = await apiClient.post(`/orders/${id}/apply-voucher`, { voucherCode })
    return res.data
  },
  // Hủy mã khuyến mãi của đơn hàng
  removeVoucher: async (id) => {
    const res = await apiClient.post(`/orders/${id}/remove-voucher`)
    return res.data
  },
  // Nhân viên thanh toán tiền mặt/thẻ — 1 bước: paid + completed + giải phóng bàn
  checkout: async (id, paymentMethod) => {
    const res = await apiClient.post(`/orders/${id}/checkout`, { paymentMethod })
    return res.data
  },
  // Khởi tạo thanh toán VNPay — trả về { paymentUrl, orderId, amount, code }
  initVnpay: async (id) => {
    const res = await apiClient.post(`/orders/${id}/vnpay-init`)
    return res.data
  },
}

export default ordersService