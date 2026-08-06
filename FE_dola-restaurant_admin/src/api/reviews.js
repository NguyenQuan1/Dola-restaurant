import { apiClient } from './client'

const reviewsService = {
  getAll: (foodId) =>
    apiClient
      .get('/reviews', { params: foodId ? { foodId } : {} })
      .then((r) => r.data),
  getById: (id) => apiClient.get(`/reviews/${id}`).then((r) => r.data),
  reply: (id, replyText) =>
    apiClient.post(`/reviews/${id}/reply`, { replyText }).then((r) => r.data),
  toggleApprove: (id) =>
    apiClient.patch(`/reviews/${id}/toggle-approve`).then((r) => r.data),
}

export default reviewsService
