import { useEffect, useState } from 'react'
import { X, Pencil, Check } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import { getUserById, updateUser } from '../api/users.js'

export default function UserDetailModal({ userId, showRoleField = true, readOnly = false, onClose, onUpdated }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', role: 'customer' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let ignore = false
    setLoading(true)
    getUserById(userId)
      .then(({ data }) => {
        if (ignore) return
        setUser(data)
        setForm({ fullName: data.fullName, email: data.email, phone: data.phone || '', role: data.role })
      })
      .catch((err) => !ignore && setError(err.response?.data?.message || 'Không tải được thông tin'))
      .finally(() => !ignore && setLoading(false))
    return () => { ignore = true }
  }, [userId])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    try {
      const payload = { fullName: form.fullName, email: form.email, phone: form.phone }
      if (showRoleField) payload.role = form.role
      const { data } = await updateUser(userId, payload)
      setUser(data)
      setEditing(false)
      onUpdated?.(data)
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Không thể lưu thay đổi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-xl bg-surface border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-ink">
            {editing ? 'Chỉnh sửa thông tin' : 'Thông tin tài khoản'}
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {loading && <p className="text-sm text-ink-soft">Đang tải...</p>}
        {error && <p className="text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">{error}</p>}

        {!loading && !error && user && !editing && (
          <div className="space-y-3">
            <Field label="Họ tên" value={user.fullName} />
            <Field label="Email" value={user.email} />
            <Field label="Số điện thoại" value={user.phone || '—'} />
            {showRoleField && <Field label="Vai trò" value={user.role} />}
            <div>
              <p className="text-xs font-medium text-ink-soft mb-1">Trạng thái</p>
              <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
            </div>

            {!readOnly && (
              <button
                onClick={() => setEditing(true)}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink-soft transition-colors"
              >
                <Pencil size={14} /> Chỉnh sửa
              </button>
            )}
          </div>
        )}

        {!loading && !error && !readOnly && editing && (
          <form onSubmit={handleSave} className="space-y-3">
            {saveError && <p className="text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">{saveError}</p>}

            <div>
              <label className="text-xs font-medium text-ink-soft">Họ tên</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">Số điện thoại</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
                className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring"
              />
            </div>
            {showRoleField && (
              <div>
                <label className="text-xs font-medium text-ink-soft">Vai trò</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((v) => ({ ...v, role: e.target.value }))}
                  className="mt-1.5 w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring"
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-ink-soft hover:bg-black/[0.03] transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-60"
              >
                <Check size={14} /> {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-soft mb-1">{label}</p>
      <p className="text-sm text-ink">{value}</p>
    </div>
  )
}