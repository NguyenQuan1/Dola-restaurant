import { apiClient } from './client'

export async function fetchPublicCategories() {
  const { data } = await apiClient.get('/public/categories')
  const list = Array.isArray(data) ? data : data?.items ?? []
  return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}