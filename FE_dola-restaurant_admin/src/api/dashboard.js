import { apiClient } from './client'

export const getDashboardStats = () =>
  apiClient.get('/dashboard').then((r) => r.data)
