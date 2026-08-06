import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Trash2, Play, Pause, Square, ChevronDown } from 'lucide-react'
import Toolbar from '../components/Toolbar.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useAuth } from '../context/AuthContext'
import promotionService from '../api/promotions.js'

const emptyForm = {
  title: '',
  type: '',
  code: '',
  description: '',
  conditions: '',
  discountType: 'percent',
  discountValue: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
}

const STATUS_LABEL = {
  draft: 'Nháp',
  ongoing: 'Đang diễn ra',
  paused: 'Tạm dừng',
  expired: 'Hết hạn',
}

// Chỉ dùng các token màu đã xác nhận có trong dự án (saffron-light/dark,
// clay/clay-light, teal, ink-soft) — tránh bịa thêm token chưa chắc tồn tại.
const STATUS_BADGE_CLASS = {
  draft: 'bg-black/[0.05] text-ink-soft',
  ongoing: 'bg-teal/10 text-teal',
  paused: 'bg-saffron-light text-saffron-dark',
  expired: 'bg-clay-light text-clay',
}

// Khớp với ALLOWED_TRANSITIONS ở backend (promotions.service.ts) — chỉ hiện
// nút hành động hợp lệ theo trạng thái hiện tại, tránh gọi API rồi bị lỗi 400.
// Không show "draft -> paused" dù backend cho phép, vì không có ý nghĩa
// nghiệp vụ rõ ràng để đưa lên UI.
const NEXT_ACTIONS = {
  draft: [{ status: 'ongoing', label: 'Bắt đầu', icon: Play }],
  paused: [
    { status: 'ongoing', label: 'Tiếp tục', icon: Play },
    { status: 'expired', label: 'Kết thúc', icon: Square },
  ],
  ongoing: [
    { status: 'paused', label: 'Tạm dừng', icon: Pause },
    { status: 'expired', label: 'Kết thúc sớm', icon: Square },
  ],
  expired: [],
}

function formatValue(p) {
  return p.discountType === 'percent'
    ? `${Number(p.discountValue)}%`
    : `${Number(p.discountValue).toLocaleString('vi-VN')}đ`
}

// Hook đóng dropdown khi click ra ngoài — dùng chung cho SelectField và StatusMenu.
function useCloseOnOutsideClick(onClose) {
  const ref = useRef(null)
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])
  return ref
}

// Thay thế <select> gốc bằng dropdown tự vẽ — trình duyệt không cho CSS lại
// màu highlight/kiểu chữ của <option> (ví dụ luôn xanh dương mặc định của
// OS), nên phải tự dựng list để khớp màu thương hiệu (teal) thay vì xanh dương.
function SelectField({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const ref = useCloseOnOutsideClick(() => setOpen(false))
  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus-ring"
      >
        <span>{selected?.label}</span>
        <ChevronDown size={16} className={`text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-paper shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`block w-full px-3 py-2 text-left text-sm ${
                opt.value === value ? 'bg-teal/10 font-medium text-teal' : 'text-ink hover:bg-black/[0.03]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Badge trạng thái kiêm nút mở dropdown — gộp "bắt đầu / tạm dừng / kết
// thúc" (theo NEXT_ACTIONS) và "xóa" vào cùng một chỗ. Cột Thao tác riêng
// chỉ còn giữ lại nút Sửa.
//
// Panel được render qua createPortal vào document.body (thay vì nằm trong
// <td>) vì TableCard bo góc bằng overflow-hidden — dropdown "position:
// absolute" nằm bên trong sẽ bị cắt mất phần tràn ra ngoài khung bảng.
// Portal + "position: fixed" theo toạ độ thực của nút bấm giúp panel luôn
// nổi trên cùng, không phụ thuộc overflow của bất kỳ container cha nào.
function StatusMenu({ promotion, onChangeStatus, onDelete, canEdit }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const actions = NEXT_ACTIONS[promotion.status] || []

  useEffect(() => {
    if (!open) return

    const updateCoords = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setCoords({ top: rect.bottom + 4, left: rect.left })
    }
    updateCoords()

    const handleClickOutside = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target)) return
      setOpen(false)
    }

    // Cuộn trang hoặc đổi kích thước cửa sổ thì đóng luôn, tránh panel
    // "đứng yên" sai vị trí so với nút bấm.
    const handleScrollOrResize = () => setOpen(false)

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open])

  if (!canEdit) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${STATUS_BADGE_CLASS[promotion.status]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {STATUS_LABEL[promotion.status]}
      </span>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-2 text-xs font-medium whitespace-nowrap transition-colors hover:brightness-95 ${STATUS_BADGE_CLASS[promotion.status]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {STATUS_LABEL[promotion.status]}
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left }}
            className="z-50 w-44 overflow-hidden rounded-lg border border-border bg-paper py-1 shadow-lg"
          >
            {actions.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted">Không còn thao tác</p>
            )}
            {actions.map(({ status, label, icon: Icon }) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setOpen(false)
                  onChangeStatus(status)
                }}
                className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm hover:bg-black/[0.03] ${
                  status === 'expired' ? 'text-clay' : 'text-teal'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}

            <div className="my-1 border-t border-border" />

            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm text-clay hover:bg-clay-light"
            >
              <Trash2 size={14} />
              Xóa chương trình
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}

function formatTimeRange(p) {
  const dateRange = `${p.startDate} → ${p.endDate}`
  if (p.startTime && p.endTime) {
    return `${dateRange} (${p.startTime.slice(0, 5)} - ${p.endTime.slice(0, 5)})`
  }
  return dateRange
}

export default function Promotions() {
  const { role } = useAuth()
  const canEdit = role === 'admin' // staff: chỉ xem, giống Categories.jsx

  const [promotions, setPromotions] = useState([])
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

  // { promotion, nextStatus } — dùng chung 1 ConfirmDialog cho mọi hành động đổi trạng thái
  const [statusChange, setStatusChange] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState('')

  const fetchPromotions = async (searchTerm = search) => {
    setLoading(true)
    setError('')
    try {
      const data = await promotionService.getAll({ search: searchTerm || undefined })
      setPromotions(data?.items ?? [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tải được danh sách khuyến mãi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromotions('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchPromotions(search), 400)
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

  const openEdit = (p) => {
    if (!canEdit || p.status === 'expired') return
    setEditing(p)
    setForm({
      title: p.title || '',
      type: p.type || '',
      code: p.code || '',
      description: p.description || '',
      conditions: p.conditions || '',
      discountType: p.discountType || 'percent',
      discountValue: p.discountValue ?? '',
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      startTime: p.startTime ? p.startTime.slice(0, 5) : '',
      endTime: p.endTime ? p.endTime.slice(0, 5) : '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedTitle = form.title.trim()
    const trimmedType = form.type.trim()

    if (!trimmedTitle) {
      setFormError('Vui lòng nhập tên chương trình')
      return
    }
    if (!trimmedType) {
      setFormError('Vui lòng nhập loại khuyến mãi')
      return
    }
    if (!form.startDate || !form.endDate) {
      setFormError('Vui lòng chọn ngày bắt đầu và ngày kết thúc')
      return
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setFormError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        title: trimmedTitle,
        type: trimmedType,
        code: form.code?.trim().toUpperCase() || undefined,
        description: form.description?.trim() || undefined,
        conditions: form.conditions?.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        startDate: form.startDate,
        endDate: form.endDate,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
      }
      if (editing) {
        await promotionService.update(editing.id, payload)
      } else {
        await promotionService.create(payload)
      }
      setModalOpen(false)
      fetchPromotions()
    } catch (err) {
      const message = err?.response?.data?.message
      setFormError(Array.isArray(message) ? message[0] : message || 'Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const requestStatusChange = (promotion, nextStatus) => {
    if (!canEdit) return
    setStatusError('')
    setStatusChange({ promotion, nextStatus })
  }

  const confirmStatusChange = async () => {
    if (!statusChange) return
    setStatusLoading(true)
    setStatusError('')
    try {
      await promotionService.changeStatus(statusChange.promotion.id, statusChange.nextStatus)
      setStatusChange(null)
      fetchPromotions()
    } catch (err) {
      setStatusError(err?.response?.data?.message || 'Không thể đổi trạng thái khuyến mãi')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await promotionService.remove(deleting.id)
      setDeleting(null)
      fetchPromotions()
    } catch (err) {
      setDeleteError(err?.response?.data?.message || 'Không thể xóa chương trình khuyến mãi này')
    } finally {
      setDeleteLoading(false)
    }
  }

  const statusDialogTitle = (() => {
    if (!statusChange) return ''
    if (statusChange.nextStatus === 'ongoing') return 'Bắt đầu khuyến mãi'
    if (statusChange.nextStatus === 'paused') return 'Tạm dừng khuyến mãi'
    return 'Kết thúc khuyến mãi'
  })()

  const statusDialogMessage = (() => {
    if (!statusChange) return ''
    if (statusChange.nextStatus === 'ongoing') {
      return `Chương trình "${statusChange.promotion.title}" sẽ chuyển sang "Đang diễn ra" và hệ thống sẽ gửi email thông báo tới toàn bộ khách hàng ngay bây giờ. Tiếp tục?`
    }
    if (statusChange.nextStatus === 'paused') {
      return `Tạm dừng chương trình "${statusChange.promotion.title}"? Khách hàng sẽ không nhận thêm thông báo cho tới khi bạn tiếp tục lại.`
    }
    return `Kết thúc chương trình "${statusChange.promotion.title}"? Hành động này không thể hoàn tác.`
  })()

  // Nhãn nút xác nhận phải khớp đúng hành động (Bắt đầu/Tiếp tục/Tạm dừng/
  // Kết thúc) — lấy từ NEXT_ACTIONS theo đúng trạng thái gốc của chương
  // trình, vì cùng nextStatus 'ongoing' nhưng xuất phát từ 'draft' thì gọi là
  // "Bắt đầu", còn từ 'paused' thì gọi là "Tiếp tục".
  const statusConfirmLabel = statusChange
    ? NEXT_ACTIONS[statusChange.promotion.status]?.find(
        (action) => action.status === statusChange.nextStatus,
      )?.label
    : undefined

  return (
    <div>
      <Toolbar
        searchPlaceholder="Tìm khuyến mãi..."
        addLabel={canEdit ? 'Thêm khuyến mãi' : undefined}
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
        <Thead columns={['Chương trình', 'Loại', 'Mã', 'Giá trị', 'Thời gian áp dụng', 'Trạng thái', 'Thao tác']} />
        <tbody>
          {loading && (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-muted">
                Đang tải...
              </td>
            </tr>
          )}
          {!loading && promotions.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-10 text-center text-muted">
                Chưa có chương trình khuyến mãi nào
              </td>
            </tr>
          )}
          {!loading &&
            promotions.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-ink">
                  {p.title}
                  {p.description && (
                    <p className="mt-0.5 text-xs font-normal text-muted line-clamp-1">{p.description}</p>
                  )}
                </Td>
                <Td>
                  <span className="px-2 py-1 rounded-md bg-saffron-light text-saffron-dark text-xs whitespace-nowrap">
                    {p.type}
                  </span>
                </Td>
                <Td>
                  {p.code ? (
                    <span className="px-2 py-1 rounded-md border border-dashed border-saffron-dark/50 text-saffron-dark text-xs font-mono font-semibold tracking-wide">
                      {p.code}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </Td>
                <Td className="font-mono">{formatValue(p)}</Td>
                <Td className="text-xs text-muted">{formatTimeRange(p)}</Td>
                <Td>
                  <StatusMenu
                    promotion={p}
                    canEdit={canEdit}
                    onChangeStatus={(status) => requestStatusChange(p, status)}
                    onDelete={() => setDeleting(p)}
                  />
                </Td>
                <Td>
                  {canEdit ? (
                    p.status !== 'expired' ? (
                      <button
                        onClick={() => openEdit(p)}
                        title="Sửa"
                        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                      >
                        <Pencil size={14} />
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )
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
        title={editing ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Tên chương trình</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Ví dụ: Khuyến mãi hè 2026"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Loại khuyến mãi</label>
              <input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
                placeholder="Ví dụ: Giảm giá hóa đơn, Mua 1 tặng 1, Freeship..."
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">
                Mã khuyến mãi <span className="text-muted font-normal">(không bắt buộc)</span>
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono tracking-wide focus-ring"
                placeholder="Ví dụ: MUAHE10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Mô tả ngắn về chương trình (không bắt buộc)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Điều kiện áp dụng</label>
            <textarea
              value={form.conditions}
              onChange={(e) => setForm({ ...form, conditions: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Ví dụ: Áp dụng cho đơn từ 200.000đ, không dùng chung voucher khác (không bắt buộc)"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Loại giảm giá</label>
              <SelectField
                value={form.discountType}
                onChange={(value) => setForm({ ...form, discountType: value })}
                options={[
                  { value: 'percent', label: 'Phần trăm (%)' },
                  { value: 'fixed', label: 'Số tiền cố định (đ)' },
                ]}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Giá trị</label>
              <input
                type="number"
                min={0}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Ngày bắt đầu</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Ngày kết thúc</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">
                Khung giờ bắt đầu <span className="text-muted font-normal">(không bắt buộc)</span>
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">
                Khung giờ kết thúc <span className="text-muted font-normal">(không bắt buộc)</span>
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
          </div>

          {formError && <p className="text-xs text-clay">{formError}</p>}

          {!editing && (
            <p className="text-xs text-muted">
              Chương trình mới được tạo ở trạng thái "Nháp". Bấm nút bắt đầu ở bảng danh sách khi bạn sẵn sàng
              gửi thông báo cho khách hàng.
            </p>
          )}

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
        open={!!statusChange}
        onClose={() => {
          setStatusChange(null)
          setStatusError('')
        }}
        onConfirm={confirmStatusChange}
        loading={statusLoading}
        title={statusDialogTitle}
        message={statusError || statusDialogMessage}
        confirmLabel={statusConfirmLabel || 'Tiếp tục'}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => {
          setDeleting(null)
          setDeleteError('')
        }}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Xóa khuyến mãi"
        message={
          deleteError ||
          `Bạn có chắc muốn xóa chương trình "${deleting?.title}"? Hành động này không thể hoàn tác.`
        }
      />
    </div>
  )
}