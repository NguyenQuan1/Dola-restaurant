import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { adminLogin, getProfile } from '../api/auth'
import { authEvents, TOKEN_KEY } from '../api/client'

const AuthContext = createContext(null)
const POLL_INTERVAL = 30000 // 30 giây — kiểm tra định kỳ xem tài khoản còn hoạt động không

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lockedMessage, setLockedMessage] = useState('')
  const pollRef = useRef(null)

  const logout = (message = '') => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    if (message) setLockedMessage(message)
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  // Interceptor gọi thẳng vào đây khi bất kỳ API nào trả 401/403
  useEffect(() => {
    authEvents.onForceLogout = (message) => logout(message)
    return () => { authEvents.onForceLogout = null }
  }, [])

  const startPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      getProfile()
        .then(({ data }) => setUser(data))
        .catch(() => {
          // Lỗi đã được interceptor xử lý logout, không cần làm gì thêm ở đây
        })
    }, POLL_INTERVAL)
  }

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoading(false); return }
    getProfile()
      .then(({ data }) => {
        setUser(data)
        startPolling()
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const login = async ({ email, password }) => {
    const { data } = await adminLogin({ email, password })
    localStorage.setItem(TOKEN_KEY, data.accessToken)
    setUser(data.user)
    setLockedMessage('')
    startPolling()
    return data.user
  }

  const value = {
    user,
    role: user?.role,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    lockedMessage,
    clearLockedMessage: () => setLockedMessage(''),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider')
  return ctx
}