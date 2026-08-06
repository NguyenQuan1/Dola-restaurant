import { apiClient } from './client'

const foodService = {
  getAll: (params) => apiClient.get('/foods', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/foods/${id}`).then((r) => r.data),
  // Không còn multipart/form-data — giờ là JSON thuần, images là mảng URL
  create: (data) => apiClient.post('/foods', data).then((r) => r.data),
  update: (id, data) => apiClient.patch(`/foods/${id}`, data).then((r) => r.data),
  toggleStatus: (id) => apiClient.patch(`/foods/${id}/toggle-status`).then((r) => r.data),
  remove: (id) => apiClient.delete(`/foods/${id}`).then((r) => r.data),
  // images: mảng URL trả về từ Uploadcare
  addImages: (id, images) => apiClient.post(`/foods/${id}/images`, { images }).then((r) => r.data),
  removeImage: (id, imageId) => apiClient.delete(`/foods/${id}/images/${imageId}`).then((r) => r.data),
  setThumbnail: (id, imageId) =>
    apiClient.patch(`/foods/${id}/images/${imageId}/thumbnail`).then((r) => r.data),
}

export default foodService