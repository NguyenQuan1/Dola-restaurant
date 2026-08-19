import { apiClient } from './client'

export async function getTableByCode(code) {
  const res = await apiClient.get(`/tables/public/${code}`)
  return res.data
}