import { apiClient } from './client'

export const registerUser = (payload) => apiClient.post('/auth/register', payload)
export const loginUser = (payload) => apiClient.post('/auth/login', payload)
export const forgotPassword = (payload) => apiClient.post('/auth/forgot-password', payload)
export const verifyCode = (payload) => apiClient.post('/auth/verify-code', payload)
export const resetPassword = (payload) => apiClient.post('/auth/reset-password', payload)

export const getProfile = () => apiClient.get('/auth/me')
export const updateProfile = (payload) => apiClient.patch('/auth/me', payload)
export const changePassword = (payload) => apiClient.post('/auth/me/change-password', payload)
export const getHistory = () => apiClient.get('/auth/me/history')