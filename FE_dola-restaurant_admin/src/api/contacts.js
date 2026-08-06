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

// ADMIN — dùng cho trang quản lý liên hệ, cùng pattern với reviewsService.
const contactsService = {
  /**
   * @param {Object} [params]
   * @param {string} [params.search]
   * @param {boolean} [params.isResolved]
   * @param {number} [params.page]
   * @param {number} [params.limit]
   */
  async getAll(params) {
    const { data } = await apiClient.get('/contacts', { params })
    return data
  },

  async getOne(id) {
    const { data } = await apiClient.get(`/contacts/${id}`)
    return data
  },

  async toggleResolved(id, isResolved) {
    const { data } = await apiClient.patch(`/contacts/${id}/resolve`, { isResolved })
    return data
  },

  async remove(id) {
    const { data } = await apiClient.delete(`/contacts/${id}`)
    return data
  },
}

export default contactsService