import { apiClient } from './client'

const tableService = {
  // Lấy danh sách toàn bộ bàn (có thể truyền params: { floor, date })
  getAll: (params) => apiClient.get('/tables', { params }).then((r) => r.data),

  // Lấy danh sách các đơn đặt bàn có thể chọn để gán/nhận bàn trong ngày
  getAvailableReservations: (params) =>
    apiClient.get('/tables/available-reservations', { params }).then((r) => r.data),

  // Lấy chi tiết 1 bàn
  getById: (id) => apiClient.get(`/tables/${id}`).then((r) => r.data),

  // Cập nhật trạng thái bàn + gán/hủy đơn đặt bàn
  // payload: { status: 'available' | 'reserved' | 'occupied', reservationId?: number, completeReservation?: boolean }
  updateStatus: (tableId, payload) =>
    apiClient.patch(`/tables/${tableId}/status`, payload).then((r) => r.data),

  // Seed dữ liệu bàn ban đầu vào DB (chỉ chạy khi bảng rỗng)
  seed: () => apiClient.post('/tables/seed-initial').then((r) => r.data),

  // Tạo bàn mới
  create: (payload) => apiClient.post('/tables', payload).then((r) => r.data),

  // Cập nhật cấu hình bàn (sức chứa, vị trí...)
  update: (tableId, payload) => apiClient.patch(`/tables/${tableId}`, payload).then((r) => r.data),

  // Xóa bàn
  remove: (tableId) => apiClient.delete(`/tables/${tableId}`).then((r) => r.data),
}

export default tableService