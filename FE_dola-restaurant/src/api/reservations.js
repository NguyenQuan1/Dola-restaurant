import { apiClient } from './client'

/**
 * Gửi yêu cầu đặt bàn từ trang khách hàng
 * @param {Object} payload
 * @param {string} payload.customerName
 * @param {string} payload.phone
 * @param {string} [payload.email]
 * @param {number} payload.partySize
 * @param {string} payload.reservationDate (YYYY-MM-DD)
 * @param {string} payload.reservationTime (HH:mm)
 * @param {string} [payload.note]
 */
export async function createPublicReservation(payload) {
  const { data } = await apiClient.post('/public/reservations', payload)
  return data
}

/**
 * Lấy lịch sử đặt bàn của cá nhân khách hàng đã đăng nhập
 */
export async function getMyReservations() {
  const { data } = await apiClient.get('/user/reservations')
  return data
}

/**
 * Khách hàng tự hủy đơn đặt bàn của mình
 * @param {number|string} id
 * @param {string} [reason]
 */
export async function cancelMyReservation(id, reason) {
  const { data } = await apiClient.patch(`/user/reservations/${id}/cancel`, { reason })
  return data
}
