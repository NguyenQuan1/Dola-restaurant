import { apiClient } from './client'

const categoryService = {
  getAll: (params) => apiClient.get('/categories', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/categories/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/categories', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/categories/${id}`, data).then((r) => r.data),
  toggleStatus: (id) =>
    apiClient.patch(`/categories/${id}/toggle-status`).then((r) => r.data),
  remove: (id) => apiClient.delete(`/categories/${id}`).then((r) => r.data),
}

export default categoryService