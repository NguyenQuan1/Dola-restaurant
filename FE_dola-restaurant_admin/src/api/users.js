import { apiClient } from './client'

export const getUsers = (includeInactive = false) =>
  apiClient.get('/auth/users', { params: { includeInactive } })

export const getUserById = (id) => apiClient.get(`/auth/users/${id}`)

export const updateUser = (id, payload) => apiClient.patch(`/auth/users/${id}`, payload)

export const toggleUserStatus = (id, isActive) =>
  apiClient.patch(`/auth/users/${id}/status`, { isActive })

export const createStaff = (payload) => apiClient.post('/auth/users', payload)