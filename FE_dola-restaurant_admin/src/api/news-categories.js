import { apiClient } from './client'

const newsCategoryService = {
  getAll: (params) => apiClient.get('/news-categories', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/news-categories/${id}`).then((r) => r.data),
  create: (data) => apiClient.post('/news-categories', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/news-categories/${id}`, data).then((r) => r.data),
  remove: (id) => apiClient.delete(`/news-categories/${id}`).then((r) => r.data),
}

export default newsCategoryService