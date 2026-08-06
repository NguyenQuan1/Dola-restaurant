import { apiClient } from './client'

const promotionService = {
  getAll: (params) => apiClient.get('/promotions', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/promotions/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/promotions', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/promotions/${id}`, data).then((r) => r.data),
  // status: 'draft' | 'ongoing' | 'paused' | 'expired'
  changeStatus: (id, status) =>
    apiClient.patch(`/promotions/${id}/status`, { status }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/promotions/${id}`).then((r) => r.data),
}

export default promotionService
