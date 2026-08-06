import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getProfile, loginUser, registerUser } from '../api/auth'
import { authEvents } from '../api/client'

const AuthContext = createContext(null)
const STORAGE_KEY = 'dola_user'
const POLL_INTERVAL = 10000 // 30 giây

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [lockedMessage, setLockedMessage] = useState('')
  const pollRef = useRef(null)
  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  // const logout = (message = '') => {
  //   setUser(null)
  //   if (message) setLockedMessage(message)
  //   stopPolling()
  // }

  // // Bất kỳ API nào (không chỉ getProfile) trả về 401/403 sẽ kích hoạt logout ngay lập tức
  // useEffect(() => {
  //   authEvents.onForceLogout = (message) => logout(message)
  //   return () => { authEvents.onForceLogout = null }
  // }, [])

  const logout = (message = '') => {
    setUser(null)
    stopPolling()

    // Chỉ chấp nhận chuỗi thật sự, bỏ qua event hoặc object khác
    if (typeof message === 'string' && message.trim()) {
      setLockedMessage(message)
    } else {
      setLockedMessage('')
    }
  }

  const startPolling = () => {
    stopPolling()
    pollRef.current = setInterval(() => {
      if (!userRef.current) return
      getProfile()
        .then(({ data }) => setUser((prev) => (prev ? { ...prev, ...data } : prev)))
        .catch(() => {
          // Lỗi 401/403 đã được interceptor xử lý logout ở trên rồi
        })
    }, POLL_INTERVAL)
  }

  // Nếu người dùng đã đăng nhập sẵn từ trước (F5 lại trang), bắt đầu polling ngay
  useEffect(() => {
    if (user?.accessToken) startPolling()
    return stopPolling
  }, [])

  const login = async ({ email, password }) => {
    const { data } = await loginUser({ email, password })
    const authUser = {
      id: data.user.id,
      fullName: data.user.fullName,
      email: data.user.email,
      accessToken: data.accessToken,
    }
    setUser(authUser)
    setLockedMessage('')
    startPolling()
    return authUser
  }

  const register = async ({ fullName, email, phone, password }) => {
    const { data } = await registerUser({ fullName, email, phone, password })
    const authUser = {
      id: data.user.id,
      fullName: data.user.fullName,
      email: data.user.email,
      accessToken: data.accessToken,
    }
    setUser(authUser)
    setLockedMessage('')
    startPolling()
    return authUser
  }

  const refreshProfile = async () => {
    if (!user?.accessToken) return null
    try {
      const { data } = await getProfile()
      const nextUser = { ...user, ...data }
      setUser(nextUser)
      return nextUser
    } catch {
      return null
    }
  }

  const updateProfile = (patch) => setUser((prev) => (prev ? { ...prev, ...patch } : prev))

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshProfile,
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