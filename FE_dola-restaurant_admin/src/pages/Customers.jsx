import { useEffect, useState } from 'react'
import { Eye, Ban, RotateCcw } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import UserDetailModal from '../components/UserDetailModal.jsx'
import { getUsers, toggleUserStatus } from '../api/users.js'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [showInactive, setShowInactive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const fetchCustomers = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await getUsers(showInactive)
      setCustomers(data.filter((u) => u.role === 'customer'))
    } catch (err) {
      setError(err.response?.data?.message || 'Không tải được danh sách khách hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCustomers() }, [showInactive])

  const handleToggle = async (id, currentIsActive) => {
    try {
      await toggleUserStatus(id, !currentIsActive)
      fetchCustomers()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái')
    }
  }

  return (
    <div>
      <Toolbar searchPlaceholder="Tìm khách hàng..." />

      <label className="mb-3 mt-1 flex w-fit items-center gap-2 text-xs text-ink-soft">
        <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
        Hiện tài khoản đã ngưng hoạt động
      </label>

      {error && <p className="mb-3 text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">{error}</p>}

      <TableCard>
        <Thead columns={['Khách hàng', 'Số điện thoại', 'Email', 'Trạng thái', 'Thao tác']} />
        <tbody>
          {loading ? (
            <Tr><Td colSpan={5} className="text-center text-ink-soft py-6">Đang tải...</Td></Tr>
          ) : customers.length === 0 ? (
            <Tr><Td colSpan={5} className="text-center text-ink-soft py-6">Không có dữ liệu</Td></Tr>
          ) : (
            customers.map((c) => (
              <Tr key={c.id}>
                <Td className={`font-medium text-ink ${!c.isActive ? 'opacity-50' : ''}`}>{c.fullName}</Td>
                <Td>{c.phone}</Td>
                <Td className="text-ink-soft">{c.email}</Td>
                <Td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></Td>
                <Td>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedId(c.id)}
                      title="Xem / Chỉnh sửa"
                      className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                    >
                      <Eye size={14} />
                    </button>
                    {c.isActive ? (
                      <button onClick={() => handleToggle(c.id, c.isActive)} title="Ngưng hoạt động" className="w-8 h-8 grid place-items-center rounded-lg hover:bg-clay-light text-clay">
                        <Ban size={14} />
                      </button>
                    ) : (
                      <button onClick={() => handleToggle(c.id, c.isActive)} title="Kích hoạt lại" className="w-8 h-8 grid place-items-center rounded-lg hover:bg-teal/10 text-teal">
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
        showRoleField={false}
        readOnly
        onClose={() => setSelectedId(null)}
      />
    )}
    </div>
  )
}