import axios from 'axios'

export const STORAGE_KEY = 'dola_user'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const user = raw ? JSON.parse(raw) : null
    if (user?.accessToken) config.headers.Authorization = `Bearer ${user.accessToken}`
  } catch {
    // localStorage hỏng dữ liệu — bỏ qua, request sẽ đi không kèm token
  }
  return config
})

export const authEvents = {
  onForceLogout: null,
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    if ((status === 401 || status === 403) && authEvents.onForceLogout) {
      authEvents.onForceLogout(err.response?.data?.message)
    }
    return Promise.reject(err)
  }
)