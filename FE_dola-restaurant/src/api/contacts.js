import { apiClient } from './client'

/**
 * Gửi liên hệ từ trang khách hàng
 * @param {Object} payload
 * @param {string} payload.fullName
 * @param {string} payload.email
 * @param {string} payload.phone
 * @param {string} [payload.subject]
 * @param {string} payload.message
 */
export async function createPublicContact(payload) {
  const { data } = await apiClient.post('/public/contacts', payload)
  return data
}