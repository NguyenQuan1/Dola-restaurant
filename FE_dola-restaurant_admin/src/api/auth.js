import { apiClient } from './client'

export const adminLogin = (payload) => apiClient.post('/auth/admin-login', payload)
export const getProfile = () => apiClient.get('/auth/me')