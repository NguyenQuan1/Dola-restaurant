import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export default function Login() {
  // const { login } = useAuth()
  const { login, lockedMessage, clearLockedMessage } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => { clearLockedMessage() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen grid place-items-center bg-paper px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-surface border border-border rounded-xl shadow-card p-8 space-y-5">
        <div className="text-center mb-2">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-teal font-display text-lg text-saffron-light mb-3">
            D
          </span>
          <h1 className="font-display text-2xl text-ink">Đăng nhập quản trị</h1>
          <p className="text-xs text-muted mt-1.5">Dành cho Quản trị viên và Nhân viên</p>
        </div>

        {lockedMessage && (<p className="text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">{lockedMessage}</p>)}

        {error && <p className="text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">{error}</p>}

        <div>
          <label className="text-xs font-medium text-ink-soft">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
            className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring"
            placeholder="ban@dolarestaurant.vn"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-soft">Mật khẩu</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
            className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-60"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <p className="text-center text-xs text-muted">
          Trang này chỉ dành cho Quản trị viên và Nhân viên nhà hàng.
        </p>
      </form>
    </div>
  )
}
