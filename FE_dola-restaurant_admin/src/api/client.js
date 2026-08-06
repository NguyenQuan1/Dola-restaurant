import axios from 'axios'

export const TOKEN_KEY = 'dola_admin_token'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Nơi AuthProvider gắn hàm logout vào, để interceptor có thể gọi
// mà không cần import trực tiếp React Context (tránh phụ thuộc vòng)
export const authEvents = {
  onForceLogout: null,
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    // 401: token hết hạn/không hợp lệ | 403: tài khoản bị khoá hoặc mất quyền
    if ((status === 401 || status === 403) && authEvents.onForceLogout) {
      authEvents.onForceLogout(err.response?.data?.message)
    }
    return Promise.reject(err)
  }
)