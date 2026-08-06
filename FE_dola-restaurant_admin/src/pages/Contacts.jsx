import { useEffect, useState } from 'react'
import { Mail, Phone, MessageSquare, CheckCircle2, Circle, Trash2, Eye, X } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import contactsService from '../api/contacts.js'

export default function Contacts() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [search, setSearch] = useState('')
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchContacts = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await contactsService.getAll()
      setRows(data.items || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách liên hệ từ server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const handleOpenDetail = (contact) => {
    setSelectedContact(contact)
  }

  const handleToggleResolved = async (contact) => {
    setTogglingId(contact.id)
    try {
      const updated = await contactsService.toggleResolved(contact.id, !contact.isResolved)

      setRows((prev) =>
        prev.map((r) => (r.id === contact.id ? { ...r, isResolved: updated.isResolved } : r))
      )

      setSelectedContact((prev) =>
        prev && prev.id === contact.id ? { ...prev, isResolved: updated.isResolved } : prev
      )
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái liên hệ.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xoá liên hệ này? Hành động không thể hoàn tác.')) return

    setDeletingId(id)
    try {
      await contactsService.remove(id)
      setRows((prev) => prev.filter((r) => r.id !== id))
      setSelectedContact((prev) => (prev && prev.id === id ? null : prev))
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xoá liên hệ này.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase()
    return (
      (r.fullName || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      (r.subject || '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <Toolbar
        searchPlaceholder="Tìm theo tên, email, SĐT, chủ đề..."
        searchValue={search}
        onSearchChange={(e) => setSearch(e.target.value)}
      />

      {error && (
        <p className="mb-3 text-sm text-clay bg-clay-light rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      <TableCard>
        <Thead columns={['ID', 'Khách hàng', 'Liên hệ', 'Chủ đề', 'Nội dung', 'Trạng thái', 'Thao tác']} />
        <tbody>
          {loading ? (
            <Tr>
              <Td colSpan={7} className="text-center text-muted py-6">
                Đang tải danh sách liên hệ...
              </Td>
            </Tr>
          ) : filteredRows.length === 0 ? (
            <Tr>
              <Td colSpan={7} className="text-center text-muted py-6">
                Chưa có liên hệ nào.
              </Td>
            </Tr>
          ) : (
            filteredRows.map((r) => (
              <Tr key={r.id}>
                <Td className="font-mono text-xs text-muted">#{r.id}</Td>
                <Td className="font-medium text-ink">{r.fullName}</Td>
                <Td className="text-xs text-muted">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} />
                    {r.email}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Phone size={12} />
                    {r.phone}
                  </div>
                </Td>
                <Td>{r.subject || <span className="text-muted italic">Không có</span>}</Td>
                <Td className="max-w-xs text-xs text-muted truncate">{r.message}</Td>
                <Td>
                  <span
                    className={
                      r.isResolved
                        ? 'inline-flex items-center gap-1 text-xs text-teal font-medium bg-teal-light/50 px-2 py-0.5 rounded'
                        : 'inline-flex items-center gap-1 text-xs text-clay font-medium bg-clay-light px-2 py-0.5 rounded'
                    }
                  >
                    {r.isResolved ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    {r.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDetail(r)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-paper bg-teal hover:bg-teal-dark rounded-lg transition-colors"
                    >
                      <Eye size={13} />
                      Xem
                    </button>
                    <button
                      onClick={() => handleToggleResolved(r)}
                      disabled={togglingId === r.id}
                      title={r.isResolved ? 'Đánh dấu chưa xử lý' : 'Đánh dấu đã xử lý'}
                      className={
                        r.isResolved
                          ? 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-clay bg-clay-light hover:bg-clay-light/70 disabled:opacity-50 rounded-lg transition-colors'
                          : 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal bg-teal-light/50 hover:bg-teal-light disabled:opacity-50 rounded-lg transition-colors'
                      }
                    >
                      {togglingId === r.id ? '...' : r.isResolved ? 'Bỏ đánh dấu' : 'Đã xử lý'}
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      title="Xoá liên hệ"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-clay hover:bg-clay-light disabled:opacity-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableCard>

      {/* MODAL XEM CHI TIẾT LIÊN HỆ */}
      {selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-surface rounded-2xl border border-border shadow-card overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-paper/50">
              <div>
                <h3 className="font-display text-lg text-ink font-semibold">
                  Chi tiết liên hệ #{selectedContact.id}
                </h3>
                <p className="text-xs text-muted">
                  Từ {selectedContact.fullName} •{' '}
                  {selectedContact.createdAt
                    ? new Date(selectedContact.createdAt).toLocaleString('vi-VN')
                    : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-black/5"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="p-4 rounded-xl bg-paper border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-saffron">
                    {selectedContact.subject || 'Không có chủ đề'}
                  </span>
                  <span
                    className={
                      selectedContact.isResolved
                        ? 'inline-flex items-center gap-1 text-xs text-teal font-medium bg-teal-light/50 px-2 py-0.5 rounded'
                        : 'inline-flex items-center gap-1 text-xs text-clay font-medium bg-clay-light px-2 py-0.5 rounded'
                    }
                  >
                    {selectedContact.isResolved ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    {selectedContact.isResolved ? 'Đã xử lý' : 'Chưa xử lý'}
                  </span>
                </div>
                <p className="text-sm text-ink font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedContact.message}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  Thông tin liên hệ
                </h4>
                <div className="p-3.5 rounded-xl bg-teal-light/30 border border-teal/20 space-y-1.5 text-xs text-ink">
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} />
                    {selectedContact.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} />
                    {selectedContact.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-border bg-paper/30 flex items-center justify-end gap-2">
              <button
                onClick={() => handleDelete(selectedContact.id)}
                disabled={deletingId === selectedContact.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-clay hover:bg-clay-light disabled:opacity-50 rounded-xl transition-colors"
              >
                <Trash2 size={13} />
                Xoá
              </button>
              <button
                onClick={() => handleToggleResolved(selectedContact)}
                disabled={togglingId === selectedContact.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-paper bg-teal hover:bg-teal-dark disabled:opacity-50 rounded-xl transition-colors shadow-sm"
              >
                {selectedContact.isResolved ? <Circle size={13} /> : <CheckCircle2 size={13} />}
                {togglingId === selectedContact.id
                  ? '...'
                  : selectedContact.isResolved
                    ? 'Đánh dấu chưa xử lý'
                    : 'Đánh dấu đã xử lý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}