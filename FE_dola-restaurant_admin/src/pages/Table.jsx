import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Users,
    Clock,
    Phone,
    User,
    Coffee,
    ChefHat,
    DoorOpen,
    Bath,
    Info,
    AlertCircle,
    Calendar,
    PlusCircle,
    Printer,
    Pencil,
    Plus,
} from 'lucide-react'
import Modal from '../components/Modal.jsx'
import tableService from '../api/table.js'
import reservationService from '../api/reservations.js'
import TableQrCode, { downloadTableQr } from '../components/TableQrCode.jsx'

/* ------------------------------------------------------------------ */
/* Helpers ngày tháng                                                  */
/* ------------------------------------------------------------------ */

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const WEEKDAY_FULL = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`)

function pad2(n) {
    return String(n).padStart(2, '0')
}

function getCurrentTimeHHmm() {
    const now = new Date()
    return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`
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

// Ngày đã qua (so với hôm nay, không tính giờ) -> không cho chọn trên lịch
function isPastDate(date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() < today.getTime()
}

function isSameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
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

/* ------------------------------------------------------------------ */
/* Cấu hình trạng thái bàn                                             */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG = {
    available: {
        label: 'Trống',
        border: 'border-teal',
        text: 'text-teal',
        hoverBg: 'hover:bg-teal-light/50',
        chipBg: 'bg-teal-light',
        dot: 'bg-teal',
        ring: 'focus-visible:ring-teal/40',
    },
    reserved: {
        label: 'Đã đặt',
        border: 'border-saffron-dark',
        text: 'text-saffron-dark',
        hoverBg: 'hover:bg-saffron-light/60',
        chipBg: 'bg-saffron-light',
        dot: 'bg-saffron-dark',
        ring: 'focus-visible:ring-saffron-dark/40',
    },
    occupied: {
        label: 'Đang dùng',
        border: 'border-clay',
        text: 'text-clay',
        hoverBg: 'hover:bg-clay-light/60',
        chipBg: 'bg-clay-light',
        dot: 'bg-clay',
        ring: 'focus-visible:ring-clay/40',
    },
}

const STATUS_OPTIONS = [
    { value: 'available', label: 'Trống' },
    { value: 'reserved', label: 'Đã đặt' },
    { value: 'occupied', label: 'Đang dùng' },
]

const RESERVATION_STATUS_LABELS = {
    pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    seated: { label: 'Đã nhận bàn', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 border-green-200' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800 border-red-200' },
}

const FLOOR_ZONES = {
    1: {
        header: [
            { label: 'Quầy lễ tân', icon: Coffee, align: 'justify-start' },
            { label: 'Bếp', icon: ChefHat, align: 'justify-end' },
        ],
        footer: [
            { label: 'Lối vào', icon: DoorOpen, align: 'justify-center' },
            { label: 'WC', icon: Bath, align: 'justify-end' },
        ],
    },
    2: {
        header: [
            { label: 'Cầu thang', icon: DoorOpen, align: 'justify-start' },
            { label: 'Khu VIP', icon: Coffee, align: 'justify-end' },
        ],
        footer: [
            { label: 'Ban công', icon: DoorOpen, align: 'justify-start' },
            { label: 'WC', icon: Bath, align: 'justify-end' },
        ],
    },
}

/* ------------------------------------------------------------------ */
/* Bố cục bàn lấy hoàn toàn từ backend (bảng "tables" trong DB).       */
/* Bàn được đặt tự do trên sơ đồ theo toạ độ pixel (x, y) — không còn  */
/* phụ thuộc vào ô lưới. Kích thước bàn được suy ra tự động từ số     */
/* khách (capacity) thay vì phải khai báo "độ rộng" thủ công.         */
/* ------------------------------------------------------------------ */

const CANVAS_PADDING = 24
const CANVAS_MIN_WIDTH = 900
const CANVAS_MIN_HEIGHT = 480
const TABLE_BASE_HEIGHT = 72

// Kích thước bàn (px) suy ra từ sức chứa — càng nhiều khách, bàn càng lớn.
// Với bàn tròn, chiều rộng = chiều cao (đường kính) để giữ hình tròn đều.
function getTableSize(capacity, shape) {
    const cap = Math.max(1, Number(capacity) || 2)
    let width
    if (cap <= 2) width = 76
    else if (cap <= 4) width = 96
    else if (cap <= 6) width = 130
    else if (cap <= 8) width = 170
    else width = 170 + (cap - 8) * 18

    if (shape === 'circle') {
        return { width, height: width }
    }
    return { width, height: TABLE_BASE_HEIGHT }
}

// Lấy toạ độ hiện tại của bàn. Hỗ trợ dữ liệu cũ còn lưu theo col/row
// (sẽ tự quy đổi sang pixel) để không vỡ layout khi backend chưa migrate.
function getTablePos(table) {
    if (table.x != null && table.y != null) {
        return { x: Number(table.x) || 0, y: Number(table.y) || 0 }
    }
    const col = Number(table.col) || 1
    const row = Number(table.row) || 1
    return { x: CANVAS_PADDING + (col - 1) * 130, y: CANVAS_PADDING + (row - 1) * 110 }
}

function rectsOverlap(a, b, margin = 10) {
    return (
        a.x < b.x + b.width + margin &&
        a.x + a.width + margin > b.x &&
        a.y < b.y + b.height + margin &&
        a.y + a.height + margin > b.y
    )
}

// Tìm bàn (nếu có) đang va chạm với vùng hình chữ nhật [x, y, width, height]
function findCollision(floorTables, excludeId, x, y, width, height) {
    const candidate = { x, y, width, height }
    return floorTables.find((t) => {
        if (t.id === excludeId) return false
        const pos = getTablePos(t)
        const size = getTableSize(t.capacity, t.shape)
        return rectsOverlap(candidate, { x: pos.x, y: pos.y, width: size.width, height: size.height })
    })
}

// Tính kích thước tối thiểu của sơ đồ (canvas) để chứa hết các bàn hiện có
function computeCanvasExtent(floorTables) {
    let maxX = CANVAS_MIN_WIDTH
    let maxY = CANVAS_MIN_HEIGHT
    floorTables.forEach((t) => {
        const pos = getTablePos(t)
        const size = getTableSize(t.capacity, t.shape)
        maxX = Math.max(maxX, pos.x + size.width + CANVAS_PADDING)
        maxY = Math.max(maxY, pos.y + size.height + CANVAS_PADDING)
    })
    return { width: maxX, height: maxY }
}

// Quét toạ độ để tìm chỗ trống đầu tiên vừa đủ cho một bàn mới/di chuyển
function findFreePosition(floorTables, width, height, canvasWidth, excludeId = null) {
    const step = 16
    const tables = excludeId ? floorTables.filter((t) => t.id !== excludeId) : floorTables
    const maxX = Math.max(canvasWidth - width - CANVAS_PADDING, CANVAS_PADDING)
    for (let y = CANVAS_PADDING; y < 4000; y += step) {
        for (let x = CANVAS_PADDING; x <= maxX; x += step) {
            if (!findCollision(tables, null, x, y, width, height)) {
                return { x, y }
            }
        }
    }
    return { x: CANVAS_PADDING, y: CANVAS_PADDING }
}

function InlineSelect({ value, onChange, options, className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none truncate rounded-lg border border-border bg-surface px-3 py-2 pr-8 text-sm text-ink-soft focus-ring"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}{opt.disabled ? ' (chỉ hôm nay)' : ''}
                    </option>
                ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" />
        </div>
    )
}

// Bàn được kéo thả tự do trên sơ đồ (chuột & cảm ứng), không phụ thuộc ô lưới
// và hoạt động kể cả khi không bật "Chỉnh sửa sơ đồ". Dùng listener gắn trên
// window (thay vì setPointerCapture) để việc kéo luôn mượt và đáng tin cậy,
// giống trải nghiệm kéo-thả đối tượng tự do như Canva.
function TableCell({ table, editMode, isMoving, onClick, onMove, canvasRef }) {
    const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available
    const isCircle = table.shape === 'circle'
    const { width, height } = getTableSize(table.capacity, table.shape)
    const basePos = getTablePos(table)

    const [dragPos, setDragPos] = useState(null)
    const [dragging, setDragging] = useState(false)
    const dragState = useRef(null)
    const activeDragListeners = useRef(null)
    const currentDragPosRef = useRef(null)

    const pos = dragPos || basePos

    const res = table.currentReservation || table.reservation
    const resName = res?.customerName || res?.name

    const stopListening = () => {
        const listeners = activeDragListeners.current
        if (!listeners) return

        window.removeEventListener('pointermove', listeners.move)
        window.removeEventListener('pointerup', listeners.up)
        window.removeEventListener('pointercancel', listeners.up)
        if (listeners.target && listeners.lostCapture) {
            listeners.target.removeEventListener('lostpointercapture', listeners.lostCapture)
        }

        activeDragListeners.current = null
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }

    const handleWindowMove = (e) => {
        const st = dragState.current
        if (!st) return
        const dx = e.clientX - st.pointerX
        const dy = e.clientY - st.pointerY
        if (!st.moved && Math.hypot(dx, dy) > 3) {
            st.moved = true
            setDragging(true)
        }
        if (st.moved) {
            const canvasRect = canvasRef.current?.getBoundingClientRect()
            const maxX = Math.max((canvasRect?.width || width + 40) - width - 2, 0)
            const maxY = Math.max((canvasRect?.height || height + 40) - height - 2, 0)
            const nx = Math.min(Math.max(st.origX + dx, 2), maxX)
            const ny = Math.min(Math.max(st.origY + dy, 2), maxY)
            currentDragPosRef.current = { x: nx, y: ny }
            setDragPos({ x: nx, y: ny })
        }
    }

    const handleWindowUp = () => {
        const st = dragState.current
        if (!st) return

        if (st.target?.releasePointerCapture) {
            try {
                if (st.target.hasPointerCapture?.(st.pointerId)) {
                    st.target.releasePointerCapture(st.pointerId)
                }
            } catch (err) {
                // Ignore if releasePointerCapture fails.
            }
        }

        const finalPos = currentDragPosRef.current || { x: st.origX, y: st.origY }
        const didMove = st.moved

        dragState.current = null
        currentDragPosRef.current = null
        stopListening()
        setDragging(false)
        setDragPos(null)

        if (didMove) {
            if (Math.round(finalPos.x) !== Math.round(st.origX) || Math.round(finalPos.y) !== Math.round(st.origY)) {
                onMove?.(table, finalPos.x, finalPos.y)
            }
        } else {
            onClick?.(table)
        }
    }

    useEffect(() => {
        return () => {
            stopListening()
        }
    }, []) // dọn dẹp listener nếu component unmount giữa lúc đang kéo

    const handlePointerDown = (e) => {
        if (e.button != null && e.button !== 0) return
        e.preventDefault()
        e.stopPropagation()

        // Đảm bảo dọn dẹp listener cũ trước khi đăng ký listener mới
        stopListening()

        dragState.current = {
            pointerX: e.clientX,
            pointerY: e.clientY,
            origX: basePos.x,
            origY: basePos.y,
            pointerId: e.pointerId,
            target: e.currentTarget,
            moved: false,
        }
        currentDragPosRef.current = null

        if (e.currentTarget.setPointerCapture) {
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch (err) {
                // Ignore if pointer capture is not supported.
            }
        }

        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'

        const moveHandler = (event) => handleWindowMove(event)
        const upHandler = () => handleWindowUp()
        const lostCaptureHandler = () => handleWindowUp()

        activeDragListeners.current = {
            move: moveHandler,
            up: upHandler,
            target: e.currentTarget,
            lostCapture: lostCaptureHandler,
        }

        window.addEventListener('pointermove', moveHandler)
        window.addEventListener('pointerup', upHandler)
        window.addEventListener('pointercancel', upHandler)
        if (e.currentTarget) {
            e.currentTarget.addEventListener('lostpointercapture', lostCaptureHandler)
        }
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onClick(table)
                }
            }}
            style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width,
                height,
                touchAction: 'none',
                zIndex: dragging ? 30 : 1,
                transform: dragging ? 'scale(1.05)' : 'scale(1)',
            }}
            className={`flex select-none flex-col items-center justify-center gap-0.5 border-2 bg-paper outline-none transition-[box-shadow,transform] duration-150 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 ${isCircle ? 'rounded-full' : 'rounded-2xl'
                } ${cfg.border} ${cfg.text} ${cfg.hoverBg} ${cfg.ring} cursor-grab active:cursor-grabbing ${dragging ? 'shadow-2xl' : ''
                } ${isMoving ? 'animate-pulse opacity-60' : ''}`}
            title={`${table.code} — ${cfg.label}${resName ? ` (${resName})` : ''}`}
        >
            {editMode && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-paper">
                    <Pencil size={10} />
                </span>
            )}
            <span className="text-sm font-semibold leading-none">{table.code}</span>
            <span className="text-[11px] leading-none opacity-70">{table.capacity} chỗ</span>
            {resName && !editMode && (
                <span className="mt-0.5 max-w-[85%] truncate text-[10px] font-medium leading-none opacity-90">
                    {resName}
                </span>
            )}
        </div>
    )
}

function TableSkeleton() {
    return (
        <div className="min-w-[600px] space-y-4 rounded-[28px] border border-border bg-surface/60 p-6">
            <div className="flex items-center justify-between">
                <div className="h-7 w-28 animate-pulse rounded-full bg-black/[0.06]" />
                <div className="h-7 w-16 animate-pulse rounded-full bg-black/[0.06]" />
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gridAutoRows: '72px',
                    columnGap: '1.25rem',
                    rowGap: '1.5rem',
                }}
            >
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-black/[0.06]" />
                ))}
            </div>
            <div className="flex items-center justify-between">
                <div className="h-7 w-24 animate-pulse rounded-full bg-black/[0.06]" />
                <div className="h-7 w-14 animate-pulse rounded-full bg-black/[0.06]" />
            </div>
        </div>
    )
}

function ZoneRow({ zones }) {
    return (
        <div className="flex items-center justify-between gap-3">
            {zones.map((zone) => (
                <span
                    key={zone.label}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-paper px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft shadow-sm ${zone.align === 'justify-center' ? 'mx-auto' : ''
                        } ${zone.align === 'justify-end' ? 'ml-auto' : ''}`}
                >
                    <zone.icon size={13} />
                    {zone.label}
                </span>
            ))}
        </div>
    )
}

/* ------------------------------------------------------------------ */
/* Form thêm mới / sửa thông tin một bàn                              */
/* ------------------------------------------------------------------ */

function TableFormModal({ open, mode, initialValues, onClose, onSubmit, onDelete, saving, error }) {
    const [form, setForm] = useState(initialValues)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        setForm(initialValues)
        setConfirmDelete(false)
    }, [initialValues, open])

    if (!open || !form) return null

    const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={mode === 'create' ? 'Thêm bàn mới' : `Sửa bàn ${initialValues.code}`}
        >
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    onSubmit(form)
                }}
                className="space-y-4 text-sm text-ink"
            >
                {error && (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-ink-soft">Mã bàn</label>
                        <input
                            type="text"
                            required
                            value={form.code}
                            onChange={(e) => handleChange('code', e.target.value)}
                            placeholder="Ví dụ: B21"
                            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm focus-ring"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-ink-soft">Tầng</label>
                        <input
                            type="number"
                            min={1}
                            required
                            value={form.floor}
                            onChange={(e) => handleChange('floor', e.target.value)}
                            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm focus-ring"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-ink-soft">Sức chứa (khách)</label>
                        <input
                            type="number"
                            min={1}
                            required
                            value={form.capacity}
                            onChange={(e) => handleChange('capacity', e.target.value)}
                            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm focus-ring"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-ink-soft">Hình dạng</label>
                        <InlineSelect
                            value={form.shape}
                            onChange={(v) => handleChange('shape', v)}
                            options={[
                                { value: 'rect', label: 'Vuông / chữ nhật' },
                                { value: 'circle', label: 'Tròn' },
                            ]}
                        />
                    </div>
                </div>

                {mode === 'create' ? (
                    <p className="rounded-lg bg-black/[0.03] p-2.5 text-[11px] text-muted">
                        Kích thước bàn được tự động tính theo số khách. Bàn mới sẽ đặt vào chỗ trống đầu tiên trên sơ đồ — sau khi tạo, bạn có thể kéo-thả tự do để sắp xếp lại vị trí bất cứ lúc nào, không cần bật chế độ chỉnh sửa.
                    </p>
                ) : (
                    <p className="rounded-lg bg-black/[0.03] p-2.5 text-[11px] text-muted">
                        Kích thước bàn tự động thay đổi theo số khách. Muốn đổi vị trí, hãy đóng form này rồi kéo-thả bàn trực tiếp trên sơ đồ. Nếu đổi sang tầng khác, bàn sẽ tự xếp vào chỗ trống đầu tiên của tầng mới.
                    </p>
                )}

                <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                    <div>
                        {mode === 'edit' && !confirmDelete && (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="text-xs font-semibold text-red-600 hover:underline"
                            >
                                Xoá bàn này
                            </button>
                        )}
                        {mode === 'edit' && confirmDelete && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-medium text-red-700">Xoá vĩnh viễn bàn {initialValues.code}?</span>
                                <button
                                    type="button"
                                    onClick={onDelete}
                                    disabled={saving}
                                    className="rounded-md bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    Xác nhận xoá
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDelete(false)}
                                    className="text-muted hover:underline"
                                >
                                    Huỷ
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="rounded-lg border border-border px-4 py-2 text-sm text-ink-soft hover:bg-black/[0.03] focus-ring"
                        >
                            Huỷ
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft focus-ring disabled:opacity-50"
                        >
                            {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo bàn' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}

/* ------------------------------------------------------------------ */
/* Trang Sơ Đồ Bàn chính                                               */
/* ------------------------------------------------------------------ */

export default function Table() {
    const [tables, setTables] = useState([])
    const [availableReservations, setAvailableReservations] = useState([])
    const [floor, setFloor] = useState(1)
    const [loading, setLoading] = useState(false)

    const today = new Date()
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState(toISODate(today))
    const [reservedDatesInMonth, setReservedDatesInMonth] = useState(new Set())

    // Đang xem đúng ngày hôm nay hay một ngày khác
    const isViewingToday = selectedDate === toISODate(today)

    const [selectedTable, setSelectedTable] = useState(null)
    const [editForm, setEditForm] = useState(null)
    const [saving, setSaving] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [loadError, setLoadError] = useState('')

    // Chế độ chỉnh sửa sơ đồ: thêm / sửa / xoá / kéo-thả bàn
    const [editMode, setEditMode] = useState(false)
    const [formModal, setFormModal] = useState(null) // { mode: 'create' | 'edit', tableId?, values }
    const [formSaving, setFormSaving] = useState(false)
    const [formError, setFormError] = useState('')
    const [dragErrorMsg, setDragErrorMsg] = useState('')
    const [savingTableIds, setSavingTableIds] = useState([])
    const canvasRef = useRef(null)

    // Load danh sách bàn & danh sách đơn đặt từ backend
    const loadData = async () => {
        setLoading(true)
        setLoadError('')
        try {
            const [tableList, resList] = await Promise.all([
                tableService.getAll({ date: selectedDate }),
                tableService.getAvailableReservations({ date: selectedDate }),
            ])

            if (Array.isArray(tableList) && tableList.length > 0) {
                setTables(tableList)
            } else {
                // Backend chưa có dữ liệu bàn -> tự động seed 20 bàn mặc định vào database
                try {
                    await tableService.seed()
                    const seededList = await tableService.getAll({ date: selectedDate })
                    setTables(Array.isArray(seededList) ? seededList : [])
                } catch (seedErr) {
                    console.error('Lỗi seed dữ liệu bàn:', seedErr)
                    setTables([])
                }
            }
            setAvailableReservations(resList || [])
        } catch (err) {
            console.error('Lỗi kết nối backend API tables:', err)
            setLoadError('Không thể tải dữ liệu bàn từ máy chủ.')
            setTables([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [floor, selectedDate])

    // Xoá thông báo lỗi kéo-thả khi đổi tầng hoặc bật/tắt chế độ chỉnh sửa
    useEffect(() => {
        setDragErrorMsg('')
    }, [floor, editMode])

    // Tải danh sách các ngày trong tháng đang xem có đơn đặt bàn (để hiện
    // chấm báo trên lịch) — gọi riêng, không phụ thuộc vào selectedDate/floor
    // vì đây là dữ liệu cho cả tháng, không phải cho 1 ngày.
    useEffect(() => {
        let cancelled = false
        const loadMonthReservations = async () => {
            try {
                const startDate = toISODate(new Date(viewYear, viewMonth, 1))
                const endDate = toISODate(new Date(viewYear, viewMonth + 1, 0))
                const response = await reservationService.getAll({ startDate, endDate, limit: 1000 })
                if (cancelled) return
                const items = response?.items || []
                const dates = new Set(
                    items
                        .filter((r) => r.status !== 'cancelled') // đơn đã huỷ thì không tính là "có đơn"
                        .map((r) => (r.reservationDate || '').slice(0, 10))
                        .filter(Boolean),
                )
                setReservedDatesInMonth(dates)
            } catch (err) {
                console.error('Lỗi tải danh sách ngày có đơn đặt bàn:', err)
                if (!cancelled) setReservedDatesInMonth(new Set())
            }
        }
        loadMonthReservations()
        return () => {
            cancelled = true
        }
    }, [viewYear, viewMonth])

    const calendarCells = useMemo(() => getCalendarCells(viewYear, viewMonth), [viewYear, viewMonth])
    const floorTables = useMemo(
        () => tables.filter((t) => Number(t.floor) === Number(floor)),
        [tables, floor],
    )
    const floorList = useMemo(() => {
        const set = new Set([1, 2])
        tables.forEach((t) => set.add(Number(t.floor)))
        return Array.from(set).sort((a, b) => a - b)
    }, [tables])
    const canvasExtent = useMemo(() => computeCanvasExtent(floorTables), [floorTables])

    const stats = useMemo(
        () => ({
            total: floorTables.length,
            available: floorTables.filter((t) => t.status === 'available').length,
            reserved: floorTables.filter((t) => t.status === 'reserved').length,
            occupied: floorTables.filter((t) => t.status === 'occupied').length,
        }),
        [floorTables],
    )

    const navigate = useNavigate()

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

    // Đưa lịch + ngày đang chọn về đúng hôm nay
    const goToToday = () => {
        const now = new Date()
        setViewYear(now.getFullYear())
        setViewMonth(now.getMonth())
        setSelectedDate(toISODate(now))
    }

    // Chọn 1 ngày trên lịch: khoá ngày quá khứ, và nếu bấm vào ô mờ thuộc
    // tháng trước/sau thì tự chuyển view sang tháng đó rồi chọn luôn ngày ấy.
    const handleSelectDate = (date, current) => {
        if (isPastDate(date)) return
        if (!current) {
            setViewYear(date.getFullYear())
            setViewMonth(date.getMonth())
        }
        setSelectedDate(toISODate(date))
    }

    const openTable = (table) => {
        const curRes = table.currentReservation || table.reservation
        setSelectedTable(table)
        setErrorMsg('')
        setEditForm({
            status: table.status,
            reservationId: table.currentReservationId || curRes?.id || '',
            completeReservation: true,
            isCreatingNew: false,
            newBooking: {
                customerName: '',
                phone: '',
                partySize: table.capacity,
                reservationTime: getCurrentTimeHHmm(),
                note: '',
            },
        })
    }

    const closeModal = () => {
        setSelectedTable(null)
        setEditForm(null)
        setErrorMsg('')
    }

    const handleSelectReservation = (resIdStr) => {
        const resId = resIdStr ? Number(resIdStr) : ''
        setEditForm((prev) => ({
            ...prev,
            reservationId: resId,
            isCreatingNew: false,
        }))
        setErrorMsg('')
    }

    const startWalkInBooking = () => {
        setEditForm((prev) => ({
            ...prev,
            status: 'occupied',
            isCreatingNew: true,
            reservationId: '',
            newBooking: {
                ...prev.newBooking,
                reservationTime: getCurrentTimeHHmm(),
            },
        }))
        setErrorMsg('')
    }

    const handleSave = async () => {
        if (!selectedTable || !editForm) return
        setErrorMsg('')

        // Kiểm tra bàn đã có ID số hợp lệ từ database chưa
        const tableDbId = Number(selectedTable.id)
        if (!selectedTable.id || isNaN(tableDbId) || !Number.isInteger(tableDbId)) {
            setErrorMsg(
                '⚠️ Bàn này chưa đồng bộ với database. Vui lòng tải lại trang (F5) để hệ thống tự động seed dữ liệu bàn.',
            )
            return
        }

        if (editForm.status === 'occupied' && !isViewingToday) {
            setErrorMsg('⚠️ Chỉ có thể chuyển bàn sang "Đang dùng" khi xem đúng ngày hôm nay.')
            return
        }

        if (editForm.status === 'occupied' && !editForm.reservationId && !editForm.isCreatingNew) {
            setErrorMsg('⚠️ Bắt buộc phải chọn một đơn đặt bàn khi chuyển bàn sang trạng thái "Đang dùng"!')
            return
        }

        setSaving(true)
        try {
            let targetReservationId = editForm.reservationId ? Number(editForm.reservationId) : null
            const saveStatus = editForm.isCreatingNew ? 'occupied' : editForm.status

            if (editForm.isCreatingNew && saveStatus !== 'available') {
                if (!editForm.newBooking.customerName.trim() || !editForm.newBooking.phone.trim()) {
                    setErrorMsg('Vui lòng nhập đầy đủ tên khách và số điện thoại cho đơn mới.')
                    setSaving(false)
                    return
                }

                const createdRes = await reservationService.create({
                    customerName: editForm.newBooking.customerName.trim(),
                    phone: editForm.newBooking.phone.trim(),
                    partySize: Number(editForm.newBooking.partySize) || selectedTable.capacity,
                    reservationDate: selectedDate,
                    reservationTime: getCurrentTimeHHmm(),
                    tableNumber: selectedTable.code,
                    note: editForm.newBooking.note?.trim() || 'Khách vãng lai tại bàn',
                    initialStatus: 'seated',
                    walkIn: true,
                })

                if (!createdRes?.id) {
                    throw new Error('Tạo đơn thành công nhưng không nhận được mã đơn. Vui lòng tải lại trang.')
                }
                targetReservationId = Number(createdRes.id)
            }

            if (saveStatus === 'occupied' && !targetReservationId) {
                setErrorMsg('⚠️ Bắt buộc phải chọn hoặc tạo đơn đặt bàn khi chuyển bàn sang trạng thái "Đang dùng"!')
                setSaving(false)
                return
            }

            await tableService.updateStatus(Number(selectedTable.id), {
                status: saveStatus,
                reservationId: targetReservationId,
                completeReservation: editForm.completeReservation,
            })

            // Reload lại sơ đồ bàn từ server
            await loadData()
            closeModal()
        } catch (err) {
            console.error('Lỗi khi lưu bàn:', err)
            const raw = err.response?.data?.message
            const message = Array.isArray(raw)
                ? raw.join(', ')
                : raw || err.message || 'Không thể lưu thay đổi trạng thái bàn.'
            setErrorMsg(message)
        } finally {
            setSaving(false)
        }
    }

    const currentLinkedRes = useMemo(() => {
        if (!selectedTable) return null
        if (editForm?.reservationId) {
            const foundInAvailable = availableReservations.find((r) => r.id === Number(editForm.reservationId))
            if (foundInAvailable) return foundInAvailable
        }
        return selectedTable.currentReservation || selectedTable.reservation || null
    }, [selectedTable, editForm?.reservationId, availableReservations])

    /* ------------------------------------------------------------ */
    /* Thêm / sửa / xoá bàn                                          */
    /* ------------------------------------------------------------ */

    const openAddTableForm = () => {
        setFormError('')
        setFormModal({
            mode: 'create',
            values: { code: '', floor, capacity: 4, shape: 'rect' },
        })
    }

    const openEditTableForm = (table) => {
        setFormError('')
        setFormModal({
            mode: 'edit',
            tableId: table.id,
            values: {
                code: table.code,
                floor: table.floor,
                capacity: table.capacity,
                shape: table.shape || 'rect',
            },
        })
    }

    const closeFormModal = () => {
        setFormModal(null)
        setFormError('')
    }

    const handleFormSubmit = async (values) => {
        setFormError('')

        const code = String(values.code || '').trim()
        const targetFloor = Number(values.floor)
        const capacity = Number(values.capacity)

        if (!code) {
            setFormError('Vui lòng nhập mã bàn.')
            return
        }
        if (!targetFloor || targetFloor < 1) {
            setFormError('Tầng không hợp lệ.')
            return
        }
        if (!capacity || capacity < 1) {
            setFormError('Sức chứa không hợp lệ.')
            return
        }

        const dupeCode = tables.some(
            (t) => t.code.toLowerCase() === code.toLowerCase() && t.id !== formModal?.tableId,
        )
        if (dupeCode) {
            setFormError(`Mã bàn "${code}" đã tồn tại.`)
            return
        }

        setFormSaving(true)
        try {
            if (formModal.mode === 'create') {
                const floorTablesForTarget = tables.filter((t) => Number(t.floor) === targetFloor)
                const { width, height } = getTableSize(capacity, values.shape)
                const { width: canvasWidth } = computeCanvasExtent(floorTablesForTarget)
                const { x, y } = findFreePosition(floorTablesForTarget, width, height, canvasWidth)

                // 🎯 ĐƯỢC BỔ SUNG: Quy đổi hoặc tính tạm col/row integer từ x, y để thỏa mãn DTO Backend
                const col = Math.max(1, Math.floor((x - 24) / 130) + 1)
                const row = Math.max(1, Math.floor((y - 24) / 110) + 1)

                await tableService.create({
                    code,
                    floor: targetFloor,
                    capacity,
                    shape: values.shape,
                    x,
                    y,
                    col: parseInt(col, 10), // ✅ Truyền col integer
                    row: parseInt(row, 10), // ✅ Truyền row integer
                })
            } else {
                const tableId = formModal.tableId
                const currentTable = tables.find((t) => t.id === tableId)
                let { x, y } = getTablePos(currentTable || {})

                const floorChanged = Number(currentTable?.floor) !== targetFloor
                const sizeChanged =
                    Number(currentTable?.capacity) !== capacity || (currentTable?.shape || 'rect') !== values.shape

                if (floorChanged) {
                    const floorTablesForTarget = tables.filter(
                        (t) => Number(t.floor) === targetFloor && t.id !== tableId,
                    )
                    const { width, height } = getTableSize(capacity, values.shape)
                    const { width: canvasWidth } = computeCanvasExtent(floorTablesForTarget)
                    const placed = findFreePosition(floorTablesForTarget, width, height, canvasWidth)
                    x = placed.x
                    y = placed.y
                } else if (sizeChanged) {
                    const siblingTables = tables.filter(
                        (t) => Number(t.floor) === targetFloor && t.id !== tableId,
                    )
                    const { width, height } = getTableSize(capacity, values.shape)
                    const collision = findCollision(siblingTables, tableId, x, y, width, height)
                    if (collision) {
                        const { width: canvasWidth } = computeCanvasExtent(siblingTables)
                        const placed = findFreePosition(siblingTables, width, height, canvasWidth)
                        x = placed.x
                        y = placed.y
                    }
                }

                // 🎯 ĐƯỢC BỔ SUNG: Tính col/row khi update
                const col = Math.max(1, Math.floor((x - 24) / 130) + 1)
                const row = Math.max(1, Math.floor((y - 24) / 110) + 1)

                await tableService.update(tableId, {
                    code,
                    floor: targetFloor,
                    capacity,
                    shape: values.shape,
                    x,
                    y,
                    col: parseInt(col, 10), // ✅ Truyền col integer
                    row: parseInt(row, 10), // ✅ Truyền row integer
                })
            }

            await loadData()
            closeFormModal()
        } catch (err) {
            console.error('Lỗi khi lưu bàn:', err)
            const raw = err.response?.data?.message
            const message = Array.isArray(raw) ? raw.join(', ') : raw || err.message || 'Không thể lưu bàn.'
            setFormError(message)
        } finally {
            setFormSaving(false)
        }
    }

    const handleDeleteTable = async () => {
        if (!formModal?.tableId) return
        setFormSaving(true)
        setFormError('')
        try {
            await tableService.remove(formModal.tableId)
            await loadData()
            closeFormModal()
        } catch (err) {
            console.error('Lỗi khi xoá bàn:', err)
            const raw = err.response?.data?.message
            const message = Array.isArray(raw) ? raw.join(', ') : raw || err.message || 'Không thể xoá bàn.'
            setFormError(message)
        } finally {
            setFormSaving(false)
        }
    }

    /* ------------------------------------------------------------ */
    /* Kéo-thả tự do để di chuyển bàn trên sơ đồ (không cần bật       */
    /* "Chỉnh sửa sơ đồ" và không phụ thuộc vào ô lưới)               */
    /* ------------------------------------------------------------ */

    const handleMoveTable = async (table, x, y) => {
        const { width, height } = getTableSize(table.capacity, table.shape)
        const siblingTables = floorTables.filter((t) => t.id !== table.id)
        const collision = findCollision(siblingTables, table.id, x, y, width, height)
        if (collision) {
            setDragErrorMsg(`Vị trí này đang bị bàn ${collision.code} chiếm, hãy thả sang chỗ khác.`)
            return
        }

        const prevTables = tables
        setDragErrorMsg('')
        setSavingTableIds((prev) => (prev.includes(table.id) ? prev : [...prev, table.id]))
        // Cập nhật lạc quan để bàn bám theo vị trí thả ngay lập tức
        setTables((prev) => prev.map((t) => (t.id === table.id ? { ...t, x, y } : t)))
        try {
            await tableService.update(table.id, { x, y })
            // Lưu thành công: giữ nguyên vị trí đã kéo, KHÔNG loadData() lại ngay
            // để tránh bị dữ liệu cũ từ server (nếu có độ trễ) ghi đè làm bàn nhảy về chỗ cũ.
        } catch (err) {
            console.error('Lỗi khi di chuyển bàn:', err)
            const raw = err?.response?.data?.message
            const message = Array.isArray(raw) ? raw.join(', ') : raw || err?.message
            setDragErrorMsg(
                `Không thể lưu vị trí mới lên máy chủ${message ? `: ${message}` : ''}. Bàn đã được trả về vị trí cũ.`,
            )
            // Chỉ khôi phục lại dữ liệu cũ khi lưu thất bại
            setTables(prevTables)
        } finally {
            setSavingTableIds((prev) => prev.filter((id) => id !== table.id))
        }
    }

    const cfg = selectedTable ? STATUS_CONFIG[editForm.status] : null
    const zones = FLOOR_ZONES[floor] || { header: [], footer: [] }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-5 min-w-0">
            {/* Cột trái: lịch tháng + tổng quan tầng */}
            <div className="space-y-5">
                <div className="rounded-xl border border-border bg-paper p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
                        <Calendar size={16} className="text-ink-soft" /> Lịch tháng
                    </h3>

                    <div className="mb-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={goPrevMonth}
                            className="w-7 h-7 shrink-0 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <InlineSelect
                            className="flex-1 min-w-0"
                            value={viewMonth}
                            onChange={(v) => setViewMonth(Number(v))}
                            options={MONTH_LABELS.map((label, i) => ({ value: i, label }))}
                        />
                        <InlineSelect
                            className="w-[92px] shrink-0"
                            value={viewYear}
                            onChange={(v) => setViewYear(Number(v))}
                            options={[viewYear - 1, viewYear, viewYear + 1].map((y) => ({ value: y, label: String(y) }))}
                        />
                        <button
                            type="button"
                            onClick={goNextMonth}
                            className="w-7 h-7 shrink-0 grid place-items-center rounded-lg hover:bg-black/[0.04] text-ink-soft"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={goToToday}
                        className="mb-3 w-full rounded-lg border border-border py-1.5 text-xs font-semibold text-ink-soft hover:bg-black/[0.04]"
                    >
                        Hôm nay
                    </button>

                    <div className="grid grid-cols-7 gap-y-1 text-center">
                        {WEEKDAY_LABELS.map((w) => (
                            <div key={w} className="text-xs font-medium text-muted py-1">
                                {w}
                            </div>
                        ))}
                        {calendarCells.map(({ date, current }, i) => {
                            const iso = toISODate(date)
                            const isSelected = iso === selectedDate
                            const isToday = isSameDate(date, today)
                            const past = isPastDate(date)
                            const hasReservation = reservedDatesInMonth.has(iso)
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={past}
                                    onClick={() => handleSelectDate(date, current)}
                                    className={`flex flex-col items-center gap-0.5 py-1.5 ${past ? 'cursor-not-allowed' : ''
                                        }`}
                                >
                                    <span
                                        className={`relative grid h-7 w-7 place-items-center rounded-full text-xs ${isSelected
                                            ? 'bg-ink text-paper font-semibold'
                                            : past
                                                ? 'text-muted/30'
                                                : isToday
                                                    ? 'border border-ink font-semibold text-ink'
                                                    : current
                                                        ? 'text-ink hover:bg-black/[0.04]'
                                                        : 'text-muted/50'
                                            }`}
                                    >
                                        {date.getDate()}
                                        {hasReservation && !isSelected && (
                                            <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-saffron-dark" />
                                        )}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-[11px] text-muted">
                        <Info size={13} className="mt-0.5 shrink-0" />
                        Đang xem sơ đồ ngày {formatFullDate(selectedDate)}.
                    </p>
                </div>

                <div className="rounded-xl border border-border bg-paper p-4">
                    <h3 className="mb-3 text-sm font-semibold text-ink">Tổng quan tầng {floor}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-black/[0.03] p-3">
                            <Users size={16} className="mb-2 text-ink-soft" />
                            <p className="text-lg font-semibold text-ink">{stats.total}</p>
                            <p className="text-xs text-muted">Tổng số bàn</p>
                        </div>
                        <div className="rounded-lg bg-teal-light p-3">
                            <span className="mb-2 block h-3 w-3 rounded-full bg-teal" />
                            <p className="text-lg font-semibold text-teal">{stats.available}</p>
                            <p className="text-xs text-teal/80">Đang trống</p>
                        </div>
                        <div className="rounded-lg bg-saffron-light p-3">
                            <span className="mb-2 block h-3 w-3 rounded-full bg-saffron-dark" />
                            <p className="text-lg font-semibold text-saffron-dark">{stats.reserved}</p>
                            <p className="text-xs text-saffron-dark/80">Đã đặt</p>
                        </div>
                        <div className="rounded-lg bg-clay-light p-3">
                            <span className="mb-2 block h-3 w-3 rounded-full bg-clay" />
                            <p className="text-lg font-semibold text-clay">{stats.occupied}</p>
                            <p className="text-xs text-clay/80">Đang dùng</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cột phải: sơ đồ bàn */}
            <div className="min-w-0 rounded-xl border border-border bg-paper p-4">
                <div className="mb-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-base font-semibold text-ink">Mặt bằng nhà hàng</h3>
                            <p className="mt-0.5 text-xs text-muted">
                                Sơ đồ bố trí bàn tầng {floor} · {formatFullDate(selectedDate)}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
                                {floorList.map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setFloor(f)}
                                        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${floor === f ? 'bg-ink text-paper shadow-sm' : 'text-ink-soft hover:bg-black/[0.04]'
                                            }`}
                                    >
                                        Tầng {f}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditMode((v) => !v)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${editMode
                                    ? 'border-ink bg-ink text-paper'
                                    : 'border-border text-ink-soft hover:bg-black/[0.04]'
                                    }`}
                            >
                                <Pencil size={14} /> {editMode ? 'Xong' : 'Chỉnh sửa sơ đồ'}
                            </button>

                            {editMode && (
                                <button
                                    type="button"
                                    onClick={openAddTableForm}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90"
                                >
                                    <Plus size={14} /> Thêm bàn
                                </button>
                            )}

                            <a
                                href="/quan-ly-ban/ma-qr"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-black/[0.04]"
                            >
                                <Printer size={14} /> In mã QR các bàn
                            </a>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                        {STATUS_OPTIONS.map((opt) => (
                            <span key={opt.value} className="flex items-center gap-1.5">
                                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[opt.value].dot}`} />
                                {opt.label}
                            </span>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-ink/20 bg-black/[0.02] px-3 py-2 text-xs text-ink-soft">
                        <span>
                            Kéo-thả bàn ở bất kỳ đâu trên sơ đồ để sắp xếp lại vị trí — không cần bật chế độ chỉnh sửa.
                            {editMode ? ' Bấm (không kéo) vào một bàn để sửa thông tin hoặc xoá.' : ''}
                        </span>
                    </div>

                    {dragErrorMsg && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                            {dragErrorMsg}
                        </div>
                    )}

                    {loadError && (
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                            <span>{loadError}</span>
                            <button type="button" onClick={loadData} className="font-semibold underline">
                                Thử lại
                            </button>
                        </div>
                    )}
                </div>

                {loading && tables.length === 0 ? (
                    <div className="overflow-x-auto">
                        <TableSkeleton />
                    </div>
                ) : (
                    <div className="overflow-auto">
                        <div className="min-w-[600px] space-y-5 rounded-[28px] border border-border bg-surface/60 p-6">
                            <ZoneRow zones={zones.header} />

                            <div
                                ref={canvasRef}
                                style={{
                                    position: 'relative',
                                    width: canvasExtent.width,
                                    height: canvasExtent.height,
                                }}
                                className="rounded-2xl bg-[radial-gradient(circle,theme(colors.border)_1px,transparent_1px)] bg-[length:22px_22px]"
                            >
                                {floorTables.map((table) => (
                                    <TableCell
                                        key={table.id}
                                        table={table}
                                        editMode={editMode}
                                        isMoving={savingTableIds.includes(table.id)}
                                        onClick={editMode ? openEditTableForm : openTable}
                                        onMove={handleMoveTable}
                                        canvasRef={canvasRef}
                                    />
                                ))}
                            </div>

                            <ZoneRow zones={zones.footer} />
                        </div>
                    </div>
                )}
            </div>

            {/* Modal chi tiết & cập nhật trạng thái bàn */}
            <Modal open={!!selectedTable} onClose={closeModal} title={selectedTable ? `Bàn ${selectedTable.code}` : ''}>
                {selectedTable && editForm && (
                    <div className="space-y-4 text-sm text-ink max-h-[80vh] overflow-y-auto pr-1">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <span className="text-ink-soft font-medium">
                                Tầng {selectedTable.floor} · Sức chứa {selectedTable.capacity} chỗ
                            </span>
                            <div className="flex items-center gap-2">
                                {selectedTable.status === 'occupied' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeModal()
                                            navigate(`/dat-mon&thanh-toan?tableId=${selectedTable.id}`)
                                        }}
                                        className="flex items-center gap-1.5 rounded-full bg-clay-light px-3 py-1 text-xs font-semibold text-clay hover:bg-clay/20 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>
                                        Xem order bàn này
                                    </button>
                                )}
                                <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg?.chipBg} ${cfg?.text}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg?.dot}`} />
                                    {cfg?.label}
                                </span>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700 flex items-start gap-2">
                                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        {/* Mã QR của bàn — dùng cho trang gọi món trong tương lai */}
                        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-4">
                            <TableQrCode code={selectedTable.code} size={200} />
                            <p className="text-sm font-semibold text-ink">Mã QR bàn {selectedTable.code}</p>
                            <p className="text-center text-[11px] text-muted">
                                Dùng để dán lên bàn, trỏ tới trang gọi món sau này.
                            </p>
                            <button
                                type="button"
                                onClick={() => downloadTableQr(selectedTable.code)}
                                className="mt-1 text-xs font-semibold text-teal hover:underline"
                            >
                                Tải mã QR (PNG)
                            </button>
                        </div>

                        {/* Chọn trạng thái bàn */}
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-ink">Cập nhật trạng thái bàn</label>
                            <InlineSelect
                                value={editForm.status}
                                onChange={(status) => {
                                    setEditForm((prev) => ({ ...prev, status }))
                                    setErrorMsg('')
                                }}
                                options={STATUS_OPTIONS.map((opt) =>
                                    opt.value === 'occupied' && !isViewingToday
                                        ? { ...opt, disabled: true }
                                        : opt,
                                )}
                            />
                            {!isViewingToday && (
                                <p className="mt-1 text-[11px] text-muted">
                                    Chỉ có thể chuyển bàn sang "Đang dùng" khi xem đúng ngày hôm nay.
                                </p>
                            )}
                        </div>

                        {isViewingToday && editForm.status === 'available' && !editForm.isCreatingNew && (
                            <button
                                type="button"
                                onClick={startWalkInBooking}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal/40 bg-teal-light/30 px-4 py-3 text-sm font-semibold text-teal hover:bg-teal-light/50 focus-ring"
                            >
                                <PlusCircle size={18} />
                                Nhận khách vãng lai — tạo đơn mới
                            </button>
                        )}

                        {(editForm.status !== 'available' || editForm.isCreatingNew) && (
                            <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
                                <div className="flex items-center justify-between border-b border-border pb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                                        <User size={14} /> Chọn đơn đặt bàn liên kết
                                    </span>
                                    {editForm.status === 'occupied' && (
                                        <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                            Bắt buộc
                                        </span>
                                    )}
                                </div>

                                {!editForm.isCreatingNew ? (
                                    <>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-ink-soft">
                                                Đơn đặt bàn khả dụng (Trong ngày {selectedDate}):
                                            </label>
                                            <select
                                                value={editForm.reservationId}
                                                onChange={(e) => handleSelectReservation(e.target.value)}
                                                className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm focus-ring"
                                            >
                                                <option value="">-- Chọn đơn đặt bàn --</option>
                                                {availableReservations.map((res) => (
                                                    <option key={res.id} value={res.id}>
                                                        #{res.id} - {res.customerName || res.name} ({res.phone}) - {res.partySize || res.guests} khách - {res.reservationTime || res.time}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {isViewingToday && (
                                            <button
                                                type="button"
                                                onClick={startWalkInBooking}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline pt-1"
                                            >
                                                <PlusCircle size={14} /> Tạo đơn mới cho khách vãng lai
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    /* Form tạo đơn nhanh cho khách vãng lai */
                                    <div className="space-y-3 rounded-lg border border-dashed border-teal/40 bg-teal-light/20 p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-teal">Thông tin khách vãng lai</span>
                                            <button
                                                type="button"
                                                onClick={() => setEditForm((prev) => ({ ...prev, isCreatingNew: false }))}
                                                className="text-xs text-muted hover:underline"
                                            >
                                                Hủy, chọn đơn có sẵn
                                            </button>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-ink-soft">Tên khách hàng</label>
                                            <input
                                                type="text"
                                                value={editForm.newBooking.customerName}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        newBooking: { ...prev.newBooking, customerName: e.target.value },
                                                    }))
                                                }
                                                placeholder="Ví dụ: Nguyễn Văn A"
                                                className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm focus-ring"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-ink-soft">Số điện thoại</label>
                                                <input
                                                    type="text"
                                                    value={editForm.newBooking.phone}
                                                    onChange={(e) =>
                                                        setEditForm((prev) => ({
                                                            ...prev,
                                                            newBooking: { ...prev.newBooking, phone: e.target.value },
                                                        }))
                                                    }
                                                    placeholder="09xx xxx xxx"
                                                    className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm focus-ring"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs font-medium text-ink-soft">Số khách</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={editForm.newBooking.partySize}
                                                    onChange={(e) =>
                                                        setEditForm((prev) => ({
                                                            ...prev,
                                                            newBooking: { ...prev.newBooking, partySize: e.target.value },
                                                        }))
                                                    }
                                                    className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm focus-ring"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-ink-soft">Ghi chú</label>
                                            <input
                                                type="text"
                                                value={editForm.newBooking.note}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        newBooking: { ...prev.newBooking, note: e.target.value },
                                                    }))
                                                }
                                                placeholder="Khách vãng lai vào ăn..."
                                                className="w-full rounded-lg border border-border bg-paper px-3 py-1.5 text-sm focus-ring"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* HIỂN THỊ ĐẦY ĐỦ THÔNG TIN ĐƠN ĐẶT BÀN LIÊN KẾT */}
                                {currentLinkedRes && !editForm.isCreatingNew && (
                                    <div className="mt-3 rounded-lg border border-border bg-paper p-3 text-xs space-y-2">
                                        <div className="flex items-center justify-between border-b border-border pb-1.5">
                                            <span className="font-semibold text-ink flex items-center gap-1">
                                                <Info size={13} className="text-teal" /> Đơn đặt bàn #{currentLinkedRes.id}
                                            </span>
                                            {currentLinkedRes.status && RESERVATION_STATUS_LABELS[currentLinkedRes.status] && (
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${RESERVATION_STATUS_LABELS[currentLinkedRes.status].color}`}>
                                                    {RESERVATION_STATUS_LABELS[currentLinkedRes.status].label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-ink-soft">
                                            <p><strong className="text-ink">Khách:</strong> {currentLinkedRes.customerName || currentLinkedRes.name}</p>
                                            <p><strong className="text-ink">SĐT:</strong> {currentLinkedRes.phone}</p>
                                            <p><strong className="text-ink">Số người:</strong> {currentLinkedRes.partySize || currentLinkedRes.guests} khách</p>
                                            <p><strong className="text-ink">Giờ đặt:</strong> {currentLinkedRes.reservationTime || currentLinkedRes.time}</p>
                                            {currentLinkedRes.email && <p className="col-span-2"><strong className="text-ink">Email:</strong> {currentLinkedRes.email}</p>}
                                            {currentLinkedRes.note && <p className="col-span-2"><strong className="text-ink">Ghi chú:</strong> {currentLinkedRes.note}</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* KHI GIẢI PHÓNG BÀN (CHUYỂN TRỐNG) */}
                        {editForm.status === 'available' && selectedTable.status !== 'available' && (
                            <div className="rounded-lg border border-border bg-surface p-3 space-y-2">
                                <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.completeReservation}
                                        onChange={(e) =>
                                            setEditForm((prev) => ({ ...prev, completeReservation: e.target.checked }))
                                        }
                                        className="rounded border-border text-teal focus:ring-teal h-4 w-4"
                                    />
                                    Tự động chuyển trạng thái đơn đặt bàn sang "Hoàn thành"
                                </label>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                className="px-4 py-2 text-sm rounded-lg border border-border text-ink-soft hover:bg-black/[0.03] focus-ring"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm rounded-lg bg-ink text-paper hover:bg-ink-soft focus-ring font-medium disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal thêm mới / sửa / xoá bàn (chế độ chỉnh sửa sơ đồ) */}
            <TableFormModal
                open={!!formModal}
                mode={formModal?.mode}
                initialValues={formModal?.values}
                onClose={closeFormModal}
                onSubmit={handleFormSubmit}
                onDelete={handleDeleteTable}
                saving={formSaving}
                error={formError}
            />
        </div>
    )
}