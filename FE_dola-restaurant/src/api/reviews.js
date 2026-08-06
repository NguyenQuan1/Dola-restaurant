import { apiClient } from './client'

export async function fetchReviewsByFoodId(foodId) {
  const { data } = await apiClient.get('/reviews', {
    params: { foodId },
  })
  return data
}

export async function createReview({ foodId, rating, comment, imageUrl }) {
  const { data } = await apiClient.post('/reviews', {
    foodId: Number(foodId),
    rating: Number(rating),
    comment,
    imageUrl,
  })
  return data
}

export async function replyReview(reviewId, replyText) {
  const { data } = await apiClient.post(`/reviews/${reviewId}/reply`, {
    replyText,
  })
  return data
}

