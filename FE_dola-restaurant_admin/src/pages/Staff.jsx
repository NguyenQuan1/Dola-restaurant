import { useEffect, useState } from 'react'
import { Eye, Ban, RotateCcw, X } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import UserDetailModal from '../components/UserDetailModal.jsx'
import { getUsers, toggleUserStatus, createStaff } from '../api/users.js'

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', role: 'staff' })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchStaff = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getUsers(showInactive)
      const list = Array.isArray(data) ? data : data.items || []
      setStaff(list.filter((u) => u.role === 'admin' || u.role === 'staff'))
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách nhân viên')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStaff() }, [showInactive])

  const handleToggle = async (id, currentIsActive) => {
    try {
      await toggleUserStatus(id, !currentIsActive)
      fetchStaff()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      await createStaff(form)
      setShowModal(false)
      setForm({ fullName: '', email: '', phone: '', password: '', role: 'staff' })
      fetchStaff()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không thể tạo tài khoản nhân viên')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Toolbar searchPlaceholder="Tìm nhân viên..." addLabel="Thêm nhân viên" onAdd={() => setShowModal(true)} />

      <label className="mb-3 mt-1 flex w-fit items-center gap-2 text-xs text-ink-soft">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Hiện tài khoản đã ngưng hoạt động
      </label>

      {error && <p className="mb-3 text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">{error}</p>}

      <TableCard>
        <Thead columns={['Nhân viên', 'Vai trò', 'Số điện thoại', 'Trạng thái', 'Thao tác']} />
        <tbody>
          {loading ? (
            <Tr><Td colSpan={5} className="text-center text-ink-soft py-6">Đang tải...</Td></Tr>
          ) : staff.length === 0 ? (
            <Tr><Td colSpan={5} className="text-center text-ink-soft py-6">Không có dữ liệu</Td></Tr>
          ) : (
            staff.map((s) => (
              <Tr key={s.id}>
                <Td className={`font-medium text-ink ${!s.isActive ? 'opacity-50' : ''}`}>{s.fullName}</Td>
                <Td><span className="px-2 py-1 rounded-md bg-black/[0.04] text-xs text-ink-soft">{s.role}</span></Td>
                <Td>{s.phone}</Td>
                <Td><StatusBadge status={s.isActive ? 'active' : 'inactive'} /></Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedId(s.id)}
                      title="Xem / Chỉnh sửa"
                      className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                    >
                      <Eye size={14} />
                    </button>
                    {s.isActive ? (
                      <button onClick={() => handleToggle(s.id, s.isActive)} title="Ngưng hoạt động" className="w-8 h-8 grid place-items-center rounded-lg hover:bg-clay-light text-clay">
                        <Ban size={14} />
                      </button>
                    ) : (
                      <button onClick={() => handleToggle(s.id, s.isActive)} title="Kích hoạt lại" className="w-8 h-8 grid place-items-center rounded-lg hover:bg-teal/10 text-teal">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableCard>

      {selectedId && (
        <UserDetailModal
          userId={selectedId}
          showRoleField
          onClose={() => setSelectedId(null)}
          onUpdated={fetchStaff}
        />
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-surface border border-border shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-ink">Thêm nhân viên</h2>
              <button onClick={() => setShowModal(false)} className="text-ink-soft hover:text-ink">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              {formError && <p className="text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">{formError}</p>}
              <input required placeholder="Họ tên" value={form.fullName} onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring" />
              <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring" />
              <input placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring" />
              <input required type="password" minLength={6} placeholder="Mật khẩu (tối thiểu 6 ký tự)" value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring" />
              <select value={form.role} onChange={(e) => setForm((v) => ({ ...v, role: e.target.value }))} className="w-full px-3 py-2.5 text-sm rounded-lg border border-border bg-paper focus-ring">
                <option value="staff">Nhân viên</option>
                <option value="admin">Quản trị viên</option>
              </select>
              <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-lg bg-ink text-paper text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-60">
                {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}