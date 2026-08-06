// Chỉnh lại đường dẫn import này cho khớp với axios instance dùng chung
// của bạn (đường dẫn giống hệt file '../api/newsCategories.js' đang dùng).
import { apiClient } from './client'

const newsService = {
  getAll: (params) => apiClient.get('/news', { params }).then((r) => r.data),
  getOne: (id) => apiClient.get(`/news/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/news', payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/news/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/news/${id}`).then((r) => r.data),
  togglePublish: (id) => apiClient.patch(`/news/${id}/toggle-publish`).then((r) => r.data),

  // Quản lý ảnh (images là mảng URL đã upload sẵn lên Uploadcare ở client)
  addImages: (id, images) => apiClient.post(`/news/${id}/images`, { images }).then((r) => r.data),
  removeImage: (id, imageId) => apiClient.delete(`/news/${id}/images/${imageId}`).then((r) => r.data),
  setThumbnail: (id, imageId) =>
    apiClient.patch(`/news/${id}/images/${imageId}/thumbnail`).then((r) => r.data),
  reorderImages: (id, imageIds) =>
    apiClient.patch(`/news/${id}/images/reorder`, { imageIds }).then((r) => r.data),
}

export default newsService