import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import Toggle from '../components/Toggle.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext'
import categoryService from '../api/categories.js'

const emptyForm = { name: '', description: '', sortOrder: 0, isActive: true }

export default function Categories() {
  const { role } = useAuth()
  const canEdit = role === 'admin' // staff: chỉ xem (👁️)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const fetchCategories = async (searchTerm = search) => {
    setLoading(true)
    setError('')
    try {
      const data = await categoryService.getAll({ search: searchTerm || undefined })
      setCategories(data?.items ?? [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách danh mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchCategories(search), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const openCreate = () => {
    if (!canEdit) return
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (c) => {
    if (!canEdit) return
    setEditing(c)
    setForm({
      name: c.name || '',
      description: c.description || '',
      sortOrder: c.sortOrder ?? 0,
      isActive: c.isActive ?? true,
    })
    setFormError('')
    setModalOpen(true)
  }

  // So khớp không phân biệt hoa/thường và bỏ khoảng trắng thừa
  const isDuplicateName = (name, excludeId) => {
    const normalized = name.trim().toLowerCase()
    return categories.some(
      (c) => c.id !== excludeId && c.name.trim().toLowerCase() === normalized
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedName = form.name.trim()

    if (!trimmedName) {
      setFormError('Vui lòng nhập tên danh mục')
      return
    }

    // Chặn trùng tên ngay ở client dựa trên danh sách hiện có
    if (isDuplicateName(trimmedName, editing?.id)) {
      setFormError('Tên danh mục này đã tồn tại, vui lòng chọn tên khác')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: trimmedName,
        description: form.description?.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: !!form.isActive,
      }
      if (editing) {
        await categoryService.update(editing.id, payload)
      } else {
        await categoryService.create(payload)
      }
      setModalOpen(false)
      fetchCategories()
    } catch (err) {
      const message = err?.response?.data?.message
      // Backend trả 409/400 khi trùng tên (nếu đã enforce ở server) sẽ hiện đúng thông báo ở đây
      setFormError(Array.isArray(message) ? message[0] : message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (c) => {
    if (!canEdit) return
    const prevCategories = categories
    setCategories((prev) =>
      prev.map((item) => (item.id === c.id ? { ...item, isActive: !item.isActive } : item)),
    )
    try {
      await categoryService.toggleStatus(c.id)
    } catch (err) {
      setCategories(prevCategories) // rollback nếu lỗi
      setError(err?.response?.data?.message || 'Không thể đổi trạng thái danh mục')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await categoryService.remove(deleting.id)
      setDeleting(null)
      fetchCategories()
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message ||
          'Không thể xóa danh mục này (có thể đang có món ăn thuộc danh mục)',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <Toolbar
        searchPlaceholder="Tìm danh mục..."
        addLabel={canEdit ? 'Thêm danh mục' : undefined}
        onAdd={openCreate}
        searchValue={search}
        onSearchChange={setSearch}
      />

      {error && (
        <div className="mb-4 rounded-lg border border-clay/30 bg-clay-light px-4 py-2.5 text-sm text-clay">
          {error}
        </div>
      )}

      <TableCard>
        <Thead columns={['Danh mục', 'Số món', 'Hoạt động', 'Thao tác']} />
        <tbody>
          {loading && (
            <tr>
              <td colSpan={4} className="px-5 py-10 text-center text-muted">
                Đang tải...
              </td>
            </tr>
          )}
          {!loading && categories.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-10 text-center text-muted">
                Chưa có danh mục nào
              </td>
            </tr>
          )}
          {!loading &&
            categories.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-ink">
                  {c.name}
                  {c.description && (
                    <p className="mt-0.5 text-xs font-normal text-muted line-clamp-1">
                      {c.description}
                    </p>
                  )}
                </Td>
                <Td>{c.foodCount ?? 0} món</Td>
                <Td>
                  <Toggle checked={c.isActive} onChange={() => toggleActive(c)} disabled={!canEdit} />
                </Td>
                <Td>
                  {canEdit ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEdit(c)}
                        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => setDeleting(c)}
                        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-clay-light text-clay"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Chỉ xem</span>
                  )}
                </Td>
              </Tr>
            ))}
        </tbody>
      </TableCard>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên danh mục</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Ví dụ: Phở, Bún, Cơm tấm..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Mô tả ngắn về danh mục (không bắt buộc)"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Thứ tự hiển thị</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div> */}
            <label className="flex items-center gap-2 pt-6 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              Hoạt động
            </label>
          </div>
          {formError && <p className="text-xs text-clay">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] focus-ring"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft focus-ring font-medium disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => {
          setDeleting(null)
          setDeleteError('')
        }}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Xóa danh mục"
        message={
          deleteError ||
          `Bạn có chắc muốn xóa danh mục "${deleting?.name}"? Hành động này không thể hoàn tác.`
        }
      />
    </div>
  )
}