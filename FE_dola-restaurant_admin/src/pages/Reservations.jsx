import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Download,
  Eye,
  MoreHorizontal,
  Check,
  X,
  Phone,
  Mail,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import StatusBadge from '../components/StatusBadge.jsx'
import { TableCard, Thead, Tr, Td } from '../components/Table.jsx'
import Modal from '../components/Modal.jsx'
import reservationService from '../api/reservations.js'

const emptyBookingForm = {
  name: '',
  phone: '',
  email: '',
  date: '',
  time: '',
  guests: 2,
  table: '',
  note: '',
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const WEEKDAY_FULL = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)

const AVATAR_STYLES = [
  'bg-teal-light text-teal',
  'bg-saffron-light text-saffron-dark',
  'bg-clay-light text-clay',
  'bg-black/5 text-ink-soft',
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatFullDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${WEEKDAY_FULL[d.getDay()]}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function getCalendarCells(year, month) {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells = []
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i
    cells.push({ date: new Date(year, month - 1, dayNum), current: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true })
  }
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, nextDay), current: false })
    nextDay++
  }
  return cells
}

function dayDotClass(dayReservations) {
  if (!dayReservations || dayReservations.length === 0) return 'bg-border'
  if (dayReservations.some((r) => r.status === 'pending')) return 'bg-saffron-dark'
  if (dayReservations.some((r) => r.status === 'confirmed')) return 'bg-teal'
  return 'bg-clay'
}

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

function FilterSelect({ value, onChange, options, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useCloseOnOutsideClick(() => setOpen(false))
  const selected = options.find((o) => o.value === value) || options[0]

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-soft focus-ring whitespace-nowrap"
      >
        <span>{selected?.label}</span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 min-w-full overflow-hidden rounded-lg border border-border bg-paper shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={`block w-full whitespace-nowrap px-3 py-2 text-left text-sm ${
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

function RowMenu({ reservation, onChangeStatus, onOpenCancel, onDelete }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const updateCoords = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setCoords({ top: rect.bottom + 4, left: rect.right - 176 })
    }
    updateCoords()
    const handleClickOutside = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const closeOnScrollResize = () => setOpen(false)
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', closeOnScrollResize, true)
    window.addEventListener('resize', closeOnScrollResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', closeOnScrollResize, true)
      window.removeEventListener('resize', closeOnScrollResize)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
        title="Thao tác"
      >
        <MoreHorizontal size={16} />
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: coords.top, left: coords.left }}
            className="z-50 w-48 overflow-hidden rounded-lg border border-border bg-paper py-1 shadow-lg"
          >
            {reservation.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onChangeStatus(reservation.id, 'confirmed')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-teal hover:bg-black/[0.03]"
                >
                  <Check size={14} />
                  Xác nhận đơn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onOpenCancel(reservation)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-clay hover:bg-clay-light"
                >
                  <X size={14} />
                  Hủy đặt bàn
                </button>
              </>
            )}

            {reservation.status === 'confirmed' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onChangeStatus(reservation.id, 'seated')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-teal hover:bg-black/[0.03]"
                >
                  <Users size={14} />
                  Đã nhận bàn
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onChangeStatus(reservation.id, 'no_show')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-600 hover:bg-amber-50"
                >
                  <AlertTriangle size={14} />
                  Khách không đến
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onOpenCancel(reservation)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-clay hover:bg-clay-light"
                >
                  <X size={14} />
                  Hủy đặt bàn
                </button>
              </>
            )}

            {reservation.status === 'seated' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onChangeStatus(reservation.id, 'completed')
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-teal hover:bg-black/[0.03]"
                >
                  <CheckCircle2 size={14} />
                  Hoàn thành
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onOpenCancel(reservation)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-clay hover:bg-clay-light"
                >
                  <X size={14} />
                  Hủy đặt bàn
                </button>
              </>
            )}

            {(reservation.status === 'completed' ||
              reservation.status === 'cancelled' ||
              reservation.status === 'no_show') && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onDelete(reservation.id)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
                Xóa đơn
              </button>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}

export default function Reservations() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(toISODate(today))

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [form, setForm] = useState(emptyBookingForm)
  const [formError, setFormError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  // View Modal
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewItem, setViewItem] = useState(null)

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const data = await reservationService.getAll({ limit: 500 })
      const items = Array.isArray(data) ? data : data.items || []
      const mapped = items.map((r) => ({
        id: r.id,
        name: r.customerName,
        phone: r.phone,
        email: r.email || '',
        date: r.reservationDate,
        time: r.reservationTime,
        guests: r.partySize,
        table: r.tableNumber || '',
        note: r.note || '',
        status: r.status,
        cancelReason: r.cancelReason || '',
        cancelledBy: r.cancelledBy || '',
        createdAt: r.createdAt,
      }))
      setRows(mapped)
    } catch (err) {
      console.error('Lỗi tải danh sách đặt bàn:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const handleChangeStatus = async (id, newStatus) => {
    try {
      await reservationService.changeStatus(id, newStatus)
      fetchReservations()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể đổi trạng thái đặt bàn')
    }
  }

  const handleOpenCancel = (reservation) => {
    setCancelTarget(reservation)
    setCancelReason('')
    setCancelError('')
    setCancelModalOpen(true)
  }

  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy đặt bàn')
      return
    }
    try {
      setCancelLoading(true)
      setCancelError('')
      await reservationService.cancel(cancelTarget.id, cancelReason.trim())
      setCancelModalOpen(false)
      fetchReservations()
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Không thể hủy đơn đặt bàn')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa đơn đặt bàn này?')) return
    try {
      await reservationService.remove(id)
      fetchReservations()
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa đơn đặt bàn')
    }
  }

  const openCreate = () => {
    setForm({ ...emptyBookingForm, date: selectedDate })
    setFormError('')
    setCreateModalOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const phone = form.phone.trim()

    if (!name) {
      setFormError('Vui lòng nhập tên khách hàng')
      return
    }
    if (!phone) {
      setFormError('Vui lòng nhập số điện thoại')
      return
    }
    if (!form.date || !form.time) {
      setFormError('Vui lòng chọn ngày và giờ đặt bàn')
      return
    }
    if (!form.guests || Number(form.guests) <= 0) {
      setFormError('Số người phải lớn hơn 0')
      return
    }

    try {
      setCreateLoading(true)
      setFormError('')
      const payload = {
        customerName: name,
        phone,
        email: form.email.trim() || undefined,
        reservationDate: form.date,
        reservationTime: form.time,
        partySize: Number(form.guests),
        tableNumber: form.table.trim() || undefined,
        note: form.note.trim() || undefined,
        initialStatus: 'confirmed',
      }
      await reservationService.create(payload)
      setSelectedDate(form.date)
      setCreateModalOpen(false)
      fetchReservations()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Không thể tạo đơn đặt bàn')
    } finally {
      setCreateLoading(false)
    }
  }

  const rowsByDate = useMemo(() => {
    const map = {}
    for (const r of rows) {
      if (!map[r.date]) map[r.date] = []
      map[r.date].push(r)
    }
    return map
  }, [rows])

  const calendarCells = useMemo(() => getCalendarCells(viewYear, viewMonth), [viewYear, viewMonth])

  const monthRows = useMemo(
    () =>
      rows.filter((r) => {
        const d = new Date(r.date)
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth
      }),
    [rows, viewYear, viewMonth],
  )

  const monthStats = useMemo(
    () => ({
      total: monthRows.length,
      pending: monthRows.filter((r) => r.status === 'pending').length,
      confirmed: monthRows.filter((r) => r.status === 'confirmed').length,
      cancelled: monthRows.filter((r) => r.status === 'cancelled').length,
    }),
    [monthRows],
  )

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const dayRows = rowsByDate[selectedDate] || []

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return dayRows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!term) return true
      return (
        r.name?.toLowerCase().includes(term) ||
        r.phone?.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term)
      )
    })
  }, [dayRows, search, statusFilter])

  useEffect(() => {
    setPage(1)
  }, [selectedDate, search, statusFilter, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const pageStart = (page - 1) * pageSize
  const pagedRows = filteredRows.slice(pageStart, pageStart + pageSize)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5">
      {/* Cột trái: lịch + tổng quan tháng */}
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-paper p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">Lịch đặt bàn</h3>

          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="w-7 h-7 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
            >
              <ChevronLeft size={15} />
            </button>
            <FilterSelect
              className="flex-1"
              value={viewMonth}
              onChange={(v) => setViewMonth(Number(v))}
              options={MONTH_LABELS.map((label, i) => ({ value: i, label }))}
            />
            <FilterSelect
              className="w-24"
              value={viewYear}
              onChange={(v) => setViewYear(Number(v))}
              options={[viewYear - 1, viewYear, viewYear + 1].map((y) => ({ value: y, label: String(y) }))}
            />
            <button
              type="button"
              onClick={goNextMonth}
              className="w-7 h-7 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((w) => (
              <div key={w} className="text-xs font-medium text-muted py-1">
                {w}
              </div>
            ))}
            {calendarCells.map(({ date, current }, i) => {
              const iso = toISODate(date)
              const isSelected = iso === selectedDate
              const dayReservations = rowsByDate[iso] || []
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(iso)}
                  className="flex flex-col items-center gap-0.5 py-1.5"
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                      isSelected
                        ? 'bg-ink text-paper font-semibold'
                        : current
                          ? 'text-ink hover:bg-black/[0.04]'
                          : 'text-muted/50'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <span
                    className={`h-1 w-1 rounded-full ${current ? dayDotClass(dayReservations) : 'bg-transparent'}`}
                  />
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-3 text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Có đặt bàn
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-saffron-dark" /> Chờ xác nhận
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-clay" /> Đã huỷ
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-border" /> Không có
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-paper p-4">
          <h3 className="mb-3 text-sm font-semibold text-ink">
            Tổng quan {MONTH_LABELS[viewMonth].toLowerCase()}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-black/[0.03] p-3">
              <Users size={16} className="mb-2 text-ink-soft" />
              <p className="text-lg font-semibold text-ink">{monthStats.total}</p>
              <p className="text-xs text-muted">Tổng đặt bàn</p>
            </div>
            <div className="rounded-lg bg-saffron-light p-3">
              <Clock size={16} className="mb-2 text-saffron-dark" />
              <p className="text-lg font-semibold text-saffron-dark">{monthStats.pending}</p>
              <p className="text-xs text-saffron-dark/80">Chờ xác nhận</p>
            </div>
            <div className="rounded-lg bg-teal-light p-3">
              <CheckCircle2 size={16} className="mb-2 text-teal" />
              <p className="text-lg font-semibold text-teal">{monthStats.confirmed}</p>
              <p className="text-xs text-teal/80">Đã xác nhận</p>
            </div>
            <div className="rounded-lg bg-clay-light p-3">
              <XCircle size={16} className="mb-2 text-clay" />
              <p className="text-lg font-semibold text-clay">{monthStats.cancelled}</p>
              <p className="text-xs text-clay/80">Đã huỷ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: danh sách đặt bàn theo ngày đã chọn */}
      <div className="rounded-xl border border-border bg-paper p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-ink">
            Danh sách đặt bàn — {formatFullDate(selectedDate)}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft focus-ring"
            >
              <Plus size={15} />
              Đặt bàn mới
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <FilterSelect
            className="w-44"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'pending', label: 'Chờ xác nhận' },
              { value: 'confirmed', label: 'Đã xác nhận' },
              { value: 'seated', label: 'Đã nhận bàn' },
              { value: 'completed', label: 'Hoàn thành' },
              { value: 'cancelled', label: 'Đã huỷ' },
              { value: 'no_show', label: 'Không đến' },
            ]}
          />
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface focus-ring placeholder:text-muted"
            />
          </div>
        </div>

        <TableCard>
          <Thead columns={['Khung giờ', 'Khách hàng', 'Trạng thái', 'Thao tác']} />
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Đang tải dữ liệu đặt bàn...
                </td>
              </tr>
            )}
            {!loading && pagedRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Chưa có lịch đặt bàn cho ngày này
                </td>
              </tr>
            )}
            {!loading &&
              pagedRows.map((r, i) => (
                <Tr key={r.id}>
                  <Td className="whitespace-nowrap font-medium text-ink">
                    {r.time}
                    <p className="text-xs font-normal text-muted">{r.date}</p>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${AVATAR_STYLES[i % AVATAR_STYLES.length]}`}
                      >
                        <User size={14} />
                      </span>
                      <div>
                        <p className="font-medium text-ink">{r.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted">
                          <Phone size={11} /> {r.phone}
                        </p>
                        {r.email && (
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <Mail size={11} /> {r.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </Td>
                  {/* <Td>
                    <p className="text-ink-soft">{r.table ? `Bàn ${r.table}` : 'Chưa xếp bàn'}</p>
                    <p className="text-xs text-muted">
                      {r.guests} người{r.note ? ` · Yêu cầu: ${r.note}` : ''}
                    </p>
                  </Td> */}
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewItem(r)
                          setViewModalOpen(true)
                        }}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-black/[0.04]"
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </button>
                      <RowMenu
                        reservation={r}
                        onChangeStatus={handleChangeStatus}
                        onOpenCancel={handleOpenCancel}
                        onDelete={handleDelete}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
          </tbody>
        </TableCard>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            Hiển thị {filteredRows.length === 0 ? 0 : pageStart + 1} đến{' '}
            {Math.min(pageStart + pageSize, filteredRows.length)} của {filteredRows.length} đặt bàn
            <FilterSelect
              className="w-28"
              value={pageSize}
              onChange={(v) => setPageSize(Number(v))}
              options={[10, 20, 50].map((n) => ({ value: n, label: `${n} / trang` }))}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 grid place-items-center rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`w-8 h-8 grid place-items-center rounded-lg text-sm ${
                  p === page ? 'bg-ink text-paper font-medium' : 'text-ink-soft hover:bg-black/[0.03]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 grid place-items-center rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal tạo đặt bàn */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Đặt bàn mới">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Tên khách hàng *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={createLoading}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
                placeholder="Ví dụ: Nguyễn Minh An"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Số điện thoại *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                disabled={createLoading}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
                placeholder="0901234567"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Email <span className="text-muted font-normal">(nhận mail xác nhận)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={createLoading}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="an.nguyen@email.com"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Ngày đặt *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                disabled={createLoading}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Giờ đặt *</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                disabled={createLoading}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">Số người *</label>
              <input
                type="number"
                min={1}
                value={form.guests}
                onChange={(e) => setForm({ ...form, guests: e.target.value })}
                disabled={createLoading}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-ink">
                Số bàn <span className="text-muted font-normal">(tùy chọn)</span>
              </label>
              <input
                value={form.table}
                onChange={(e) => setForm({ ...form, table: e.target.value })}
                disabled={createLoading}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
                placeholder="Ví dụ: Bàn 5"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Ghi chú <span className="text-muted font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              disabled={createLoading}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring"
              placeholder="Ví dụ: Bàn gần cửa sổ, ghế trẻ em..."
            />
          </div>

          {formError && <p className="text-xs text-clay">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              disabled={createLoading}
              className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] focus-ring"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft focus-ring font-medium disabled:opacity-50"
            >
              {createLoading ? 'Đang tạo...' : 'Tạo đơn đặt bàn'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Hủy Đặt Bàn */}
      <Modal open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Hủy Đặt Bàn">
        <form onSubmit={handleConfirmCancel} className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-sm text-ink-soft">
            <p className="font-medium text-ink">Thông tin đơn đặt bàn:</p>
            <p className="mt-1">
              Khách hàng: <strong>{cancelTarget?.name}</strong> ({cancelTarget?.phone})
            </p>
            <p>
              Thời gian: <strong>{cancelTarget?.date}</strong> lúc <strong>{cancelTarget?.time}</strong> ({cancelTarget?.guests} khách)
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">
              Lý do hủy đặt bàn * <span className="text-xs text-muted font-normal">(lý do này sẽ được gửi Gmail cho khách)</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              disabled={cancelLoading}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-ring placeholder:text-muted"
              placeholder="Ví dụ: Nhà hàng kín chỗ khung giờ này, Khách gọi điện yêu cầu hủy..."
            />
          </div>

          {cancelError && <p className="text-xs text-clay">{cancelError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelLoading}
              className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] focus-ring"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={cancelLoading}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 focus-ring font-medium disabled:opacity-50"
            >
              {cancelLoading ? 'Đang gửi Gmail hủy...' : 'Xác nhận Hủy & Gửi Gmail'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xem Chi Tiết */}
      <Modal open={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Chi Tiết Đặt Bàn">
        {viewItem && (
          <div className="space-y-4 text-sm text-ink">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="font-semibold text-lg">Mã đơn #{viewItem.id}</span>
              <StatusBadge status={viewItem.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted">Họ và tên</p>
                <p className="font-medium mt-0.5">{viewItem.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Số điện thoại</p>
                <p className="font-medium mt-0.5">{viewItem.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Email</p>
                <p className="font-medium mt-0.5">{viewItem.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Số khách</p>
                <p className="font-medium mt-0.5">{viewItem.guests} người</p>
              </div>
              <div>
                <p className="text-xs text-muted">Ngày đặt</p>
                <p className="font-medium mt-0.5">{viewItem.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Giờ đặt</p>
                <p className="font-medium mt-0.5">{viewItem.time}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Số bàn</p>
                <p className="font-medium mt-0.5">{viewItem.table ? `Bàn ${viewItem.table}` : 'Chưa xếp'}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Ghi chú</p>
                <p className="font-medium mt-0.5">{viewItem.note || '—'}</p>
              </div>
            </div>

            {viewItem.status === 'cancelled' && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200 mt-2">
                <p className="font-semibold text-red-700">Thông tin hủy đơn:</p>
                <p className="mt-1 text-xs text-red-600">
                  Lý do: <strong>{viewItem.cancelReason || 'Không có lý do'}</strong>
                </p>
                <p className="text-xs text-red-600">
                  Người thực hiện: <strong>{viewItem.cancelledBy === 'customer' ? 'Khách hàng tự hủy' : 'Nhân viên / Admin hủy'}</strong>
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03]"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}