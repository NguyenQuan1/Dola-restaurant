import { apiClient } from './client'

const reservationService = {
  getAll: (params) => apiClient.get('/reservations', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/reservations/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/reservations', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/reservations/${id}`, data).then((r) => r.data),
  changeStatus: (id, status) =>
    apiClient.patch(`/reservations/${id}/status`, { status }).then((r) => r.data),
  cancel: (id, reason) =>
    apiClient.patch(`/reservations/${id}/cancel`, { reason }).then((r) => r.data),
  remove: (id) => apiClient.delete(`/reservations/${id}`).then((r) => r.data),
}

export default reservationService
