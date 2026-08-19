import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import { useSearchParams } from 'react-router-dom'
import {
    ArrowLeftRight,
    XCircle,
    Search,
    CreditCard,
    Wallet,
    QrCode,
    CheckCircle2,
    Loader2,
    Printer,
    RefreshCw,
    Bell,
    Utensils,
    ImageOff,
    ChevronDown,
    Tag,
    Trash2,
    Eye,
    Calendar,
    DollarSign,
    Receipt,
    FileText,
    Filter,
    AlertTriangle,
    Check,
    X,
    Clock,
    History,
    Ban,
} from 'lucide-react'
import { io } from 'socket.io-client'
import ordersService from '../api/orders.js'
import tableService from '../api/table.js'
import promotionService from '../api/promotions.js'
import { apiClient } from '../api/client.js'

const PAYMENT_METHODS = [
    { id: 'cash', label: 'Tiền mặt', icon: Wallet, color: 'text-green-700 bg-green-100 border-green-200' },
    { id: 'card', label: 'Thẻ ngân hàng', icon: CreditCard, color: 'text-blue-700 bg-blue-100 border-blue-200' },
    { id: 'ewallet', label: 'Ví điện tử (VNPay QR)', icon: QrCode, color: 'text-pink-700 bg-pink-100 border-pink-200' },
    { id: 'transfer', label: 'Chuyển khoản', icon: QrCode, color: 'text-purple-700 bg-purple-100 border-purple-200' },
]

const QUICK_CANCEL_REASONS = [
    'Khách đổi ý không dùng',
    'Khách đặt nhầm món',
    'Bếp hết nguyên liệu / Hết món',
    'Lên món quá lâu / Khách hủy',
]

const toImageSrc = (url) => {
    if (!url) return null
    if (/^https?:\/\//i.test(url)) return url
    const baseUrl = apiClient.defaults?.baseURL || 'http://localhost:3000'
    return `${baseUrl}${url}`
}

function formatVnd(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

function formatDateTime(isoString) {
    if (!isoString) return '—'
    const d = new Date(isoString)
    return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

// Đổi số tiền (VND, số nguyên) sang chữ tiếng Việt, dùng cho dòng "Bằng chữ".
function amountToVietnameseWords(value) {
    const n = Math.floor(Math.abs(Number(value) || 0))
    if (n === 0) return 'Không đồng'

    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

    function threeDigits(num, hasPrefix) {
        const h = Math.floor(num / 100)
        const t = Math.floor((num % 100) / 10)
        const u = num % 10
        let str = ''
        if (h > 0 || hasPrefix) str += `${digits[h]} trăm `
        if (t === 0) {
            if (u > 0 && (h > 0 || hasPrefix)) str += 'lẻ '
        } else if (t === 1) {
            str += 'mười '
        } else {
            str += `${digits[t]} mươi `
        }
        if (u === 1 && t > 1) str += 'mốt '
        else if (u === 5 && t > 0) str += 'lăm '
        else if (u > 0) str += `${digits[u]} `
        return str.trim()
    }

    const units = ['', 'nghìn', 'triệu', 'tỷ']
    const groups = []
    let remaining = n
    while (remaining > 0) {
        groups.unshift(remaining % 1000)
        remaining = Math.floor(remaining / 1000)
    }

    let words = ''
    groups.forEach((group, idx) => {
        if (group === 0) return
        const unitIdx = groups.length - 1 - idx
        const hasPrefix = idx > 0
        words += `${threeDigits(group, hasPrefix)} ${units[unitIdx]} `.trim() + ' '
    })

    words = words.trim().replace(/\s+/g, ' ')
    return words.charAt(0).toUpperCase() + words.slice(1) + ' đồng'
}

// Sub-component để render ảnh món ăn với fallback an toàn khi load lỗi
function FoodItemThumbnail({ src, alt }) {
    const [imgError, setImgError] = useState(false)
    const fullSrc = toImageSrc(src)

    if (!fullSrc || imgError) {
        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface border border-border text-muted">
                <Utensils size={16} />
            </div>
        )
    }

    return (
        <img
            src={fullSrc}
            alt={alt || 'Food image'}
            onError={() => setImgError(true)}
            className="h-9 w-9 shrink-0 rounded-lg object-cover border border-border"
        />
    )
}

export default function OrdersManagement() {
    // Tab đang chọn: 'active' (Đang phục vụ) | 'history' (Lịch sử đơn hàng)
    const [currentTab, setCurrentTab] = useState('active')

    // ──────────────────────────────────────────────────────────
    // STATE: ĐƠN HÀNG ĐANG PHỤC VỤ (ACTIVE ORDERS)
    // ──────────────────────────────────────────────────────────
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrderId, setSelectedOrderId] = useState(null)
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash')
    const [customerPaid, setCustomerPaid] = useState('')
    const [checkoutNote, setCheckoutNote] = useState('')
    const [discountCode, setDiscountCode] = useState('')
    const [isVoucherDropdownOpen, setIsVoucherDropdownOpen] = useState(false)
    const voucherDropdownRef = useRef(null)
    const [voucherLoading, setVoucherLoading] = useState(false)
    const [voucherError, setVoucherError] = useState(null)
    const [activePromotions, setActivePromotions] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)
    const [socketNotification, setSocketNotification] = useState(null)

    // ──── VNPay Modal State ────────────────────────────────────────
    const [vnpayModal, setVnpayModal] = useState(null) // null | { paymentUrl, orderId, amount, code, qrDataUrl }
    const [vnpayLoading, setVnpayLoading] = useState(false)
    const [vnpayStatus, setVnpayStatus] = useState('idle') // 'idle' | 'pending' | 'success' | 'fail'
    const [vnpayError, setVnpayError] = useState(null)
    const vnpayWindowRef = useRef(null)

    // Modal Hủy Món
    const [cancelModalItem, setCancelModalItem] = useState(null)
    const [cancelReason, setCancelReason] = useState(QUICK_CANCEL_REASONS[0])
    const [customCancelReason, setCustomCancelReason] = useState('')
    const [cancelLoading, setCancelLoading] = useState(false)

    // ──────────────────────────────────────────────────────────
    // STATE: LỊCH SỬ ĐƠN HÀNG (HISTORY)
    // ──────────────────────────────────────────────────────────
    const [historyOrders, setHistoryOrders] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [historySearch, setHistorySearch] = useState('')
    const [historyStatus, setHistoryStatus] = useState('all')
    const [historyDatePreset, setHistoryDatePreset] = useState('all')
    const [historyStartDate, setHistoryStartDate] = useState('')
    const [historyEndDate, setHistoryEndDate] = useState('')
    const [historyPaymentMethodFilter, setHistoryPaymentMethodFilter] = useState('all')

    // Modal xem chi tiết đơn hàng lịch sử / in hóa đơn
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null)
    const [detailModalOpen, setDetailModalOpen] = useState(false)

    // In hóa đơn
    const [printOrderData, setPrintOrderData] = useState(null)

    // Đóng dropdown voucher khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (voucherDropdownRef.current && !voucherDropdownRef.current.contains(event.target)) {
                setIsVoucherDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Đọc tableId từ query param (?tableId=X) khi navigate từ trang Quản lý bàn
    const [searchParams] = useSearchParams()

    // Load ongoing promotions cho admin chọn nhanh
    useEffect(() => {
        promotionService
            .getAll({ status: 'ongoing' })
            .then((res) => {
                const list = res?.items || res || []
                setActivePromotions(list.filter((p) => p.code))
            })
            .catch(() => { })
    }, [])

    // Load active orders từ backend
    const fetchActiveOrders = useCallback(async (autoSelectFirst = false) => {
        try {
            const data = await ordersService.getActive()
            const list = Array.isArray(data) ? data : []
            setOrders(list)

            // Nếu có tableId từ query param -> ưu tiên select order của bàn đó
            const paramTableId = searchParams.get('tableId')
            setSelectedOrderId((prev) => {
                if (paramTableId) {
                    const tableOrder = list.find((o) => String(o.tableId) === String(paramTableId))
                    if (tableOrder) return tableOrder.id
                }
                if (!prev || autoSelectFirst) return list[0]?.id ?? null
                const exists = list.some((o) => o.id === prev)
                return exists ? prev : (list[0]?.id ?? null)
            })
        } catch (err) {
            console.error('Lỗi khi lấy danh sách order active:', err)
            setError('Không thể tải danh sách đơn hàng từ máy chủ.')
        } finally {
            setLoading(false)
        }
    }, [searchParams])

    // Load history orders từ backend
    const fetchHistoryOrders = useCallback(async () => {
        setHistoryLoading(true)
        try {
            const params = {}
            if (historyStatus && historyStatus !== 'all') {
                params.status = historyStatus
            }
            if (historyPaymentMethodFilter && historyPaymentMethodFilter !== 'all') {
                params.paymentMethod = historyPaymentMethodFilter
            }
            if (historySearch.trim()) {
                params.search = historySearch.trim()
            }

            // Xử lý khoảng ngày
            const now = new Date()
            const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now)
            if (historyDatePreset === 'today') {
                params.date = todayStr
            } else if (historyDatePreset === '7days') {
                const past7 = new Date()
                past7.setDate(past7.getDate() - 7)
                params.startDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(past7)
                params.endDate = todayStr
            } else if (historyDatePreset === '30days') {
                const past30 = new Date()
                past30.setDate(past30.getDate() - 30)
                params.startDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(past30)
                params.endDate = todayStr
            } else if (historyDatePreset === 'custom') {
                if (historyStartDate) params.startDate = historyStartDate
                if (historyEndDate) params.endDate = historyEndDate
            }

            const data = await ordersService.getAll(params)
            setHistoryOrders(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error('Lỗi khi lấy lịch sử đơn hàng:', err)
        } finally {
            setHistoryLoading(false)
        }
    }, [historyStatus, historyPaymentMethodFilter, historySearch, historyDatePreset, historyStartDate, historyEndDate])

    // Khi chuyển sang tab history thì tự động tải dữ liệu
    useEffect(() => {
        if (currentTab === 'history') {
            fetchHistoryOrders()
        }
    }, [currentTab, fetchHistoryOrders])

    // Khởi tạo fetch dữ liệu active & WebSocket connection
    useEffect(() => {
        fetchActiveOrders(true)

        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const token = localStorage.getItem('token')

        const socket = io(`${backendUrl}/orders`, {
            transports: ['websocket', 'polling'],
            auth: { token },
            query: { token },
        })

        socket.on('connect', () => {
            console.log('⚡ Admin Orders WebSocket connected:', socket.id)
            socket.emit('staff:join', { token })
        })

        socket.on('orders:new', (orderData) => {
            console.log('🔔 Đơn hàng mới:', orderData)
            setSocketNotification(`Bàn ${orderData.table?.code || ''} vừa tạo order mới (${orderData.code})!`)
            fetchActiveOrders()
            if (currentTab === 'history') fetchHistoryOrders()
        })

        socket.on('orders:updated', (orderData) => {
            console.log('🔔 Đơn hàng cập nhật:', orderData)
            fetchActiveOrders()
            if (currentTab === 'history') fetchHistoryOrders()
        })

        socket.on('orders:checkout', (orderData) => {
            console.log('🔔 Đơn hàng hoàn tất thanh toán:', orderData)
            // Nếu đơn đang hiển thị trong VNPay modal → cập nhật thành công
            setVnpayModal((prev) => {
                if (prev && prev.orderId === orderData.id) {
                    setVnpayStatus('success')
                    const tableCode = orderData.table?.code
                    setSuccessMessage(
                        `Đã thanh toán thành công qua VNPay — đơn ${orderData.code}` +
                        (tableCode ? ` — bàn ${tableCode}.` : '.')
                    )
                    setTimeout(() => {
                        setVnpayModal(null)
                        setVnpayStatus('idle')
                    }, 2500)
                }
                return prev
            })
            fetchActiveOrders()
            if (currentTab === 'history') fetchHistoryOrders()
        })

        socket.on('orders:payment-requested', (orderData) => {
            console.log('🔔 Yêu cầu thanh toán từ bàn:', orderData)
            setSocketNotification(`⚠️ Bàn ${orderData.table?.code || ''} vừa gửi YÊU CẦU THANH TOÁN!`)
            fetchActiveOrders()
        })

        // Lắng nghe postMessage từ tab VNPay callback
        const handleVnpayMessage = (event) => {
            if (event.data?.type === 'VNPAY_SUCCESS') {
                setVnpayStatus('success')
                if (vnpayWindowRef.current) vnpayWindowRef.current.close()
                setSuccessMessage(
                    `Đã thanh toán thành công qua VNPay! Đơn hàng đã được cập nhật.`
                )
                fetchActiveOrders()
                if (currentTab === 'history') fetchHistoryOrders()
                setTimeout(() => {
                    setVnpayModal(null)
                    setVnpayStatus('idle')
                }, 2500)
            } else if (event.data?.type === 'VNPAY_FAIL') {
                setVnpayStatus('fail')
                setVnpayError(event.data.message || 'Thanh toán không thành công')
            }
        }
        window.addEventListener('message', handleVnpayMessage)

        return () => {
            socket.disconnect()
            window.removeEventListener('message', handleVnpayMessage)
        }
    }, [fetchActiveOrders, fetchHistoryOrders, currentTab])

    const order = useMemo(() => {
        return orders.find((o) => o.id === selectedOrderId) || null
    }, [orders, selectedOrderId])

    // Lọc danh sách voucher thực sự đang sử dụng được
    const usablePromotions = useMemo(() => {
        const now = new Date()
        const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now)
        const timeStr = now.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false,
        })

        return activePromotions.filter((p) => {
            if (!p.code) return false
            if (p.status !== 'ongoing') return false
            if (p.startDate && todayStr < p.startDate) return false
            if (p.endDate && todayStr > p.endDate) return false
            if (p.startTime && timeStr < p.startTime) return false
            if (p.endTime && timeStr > p.endTime) return false
            if (p.usageLimit != null && p.usedCount != null && Number(p.usedCount) >= Number(p.usageLimit)) return false
            return true
        })
    }, [activePromotions])

    // Lọc danh sách voucher theo từ khóa người dùng nhập trong ô input
    const filteredUsablePromotions = useMemo(() => {
        if (!discountCode) return usablePromotions
        const s = discountCode.trim().toLowerCase()
        return usablePromotions.filter(
            (p) =>
                p.code.toLowerCase().includes(s) ||
                (p.title && p.title.toLowerCase().includes(s))
        )
    }, [usablePromotions, discountCode])

    // Đồng bộ mã voucher của đơn khi chọn đơn
    useEffect(() => {
        if (order) {
            setDiscountCode(order.promotionCode || '')
            setIsVoucherDropdownOpen(false)
            setVoucherError(null)
        }
    }, [order?.id, order?.promotionCode])

    // Chuẩn hóa danh sách items từ backend (orderItems)
    const items = useMemo(() => {
        const rawItems = order?.orderItems || order?.items || []
        return rawItems.map((item) => {
            const foodObj = item.food || {}
            const categoryName = foodObj.category?.name || foodObj.category || 'Món ăn'
            return {
                id: item.id,
                food: {
                    id: foodObj.id,
                    name: foodObj.name || 'Món ăn',
                    category: categoryName,
                    thumbnailUrl: foodObj.thumbnailUrl || null,
                },
                price: Number(item.price || foodObj.price || 0),
                quantity: Number(item.quantity || 1),
                note: item.note || '',
                status: item.status || 'pending',
            }
        })
    }, [order])

    const categories = useMemo(() => {
        const set = new Map()
        items.forEach((item) => {
            const cat = item.food?.category
            if (cat) set.set(cat, cat)
        })
        return Array.from(set.values())
    }, [items])

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const name = (item.food?.name || '').toLowerCase()
            const cat = item.food?.category
            const matchesSearch = !search || name.includes(search.toLowerCase())
            const matchesCategory = activeCategory === 'all' || cat === activeCategory
            return matchesSearch && matchesCategory
        })
    }, [items, search, activeCategory])

    // Tạm tính chỉ tính trên các món chưa bị hủy
    const subtotal = useMemo(
        () =>
            items
                .filter((item) => item.status !== 'cancelled')
                .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
        [items]
    )

    const vatAmount = Number(order?.vatAmount ?? 0)
    const serviceFeeAmount = Number(order?.serviceFeeAmount ?? 0)
    const discountAmount = Number(order?.discountAmount ?? 0)
    const totalAmount = Number(
        order?.finalAmount ?? Math.max(0, subtotal + vatAmount + serviceFeeAmount - discountAmount)
    )

    const paidNumber = Number(customerPaid) || 0
    const change = paidNumber - totalAmount

    const selectOrder = (id) => {
        setSelectedOrderId(id)
        setSearch('')
        setActiveCategory('all')
        setSelectedPaymentMethod('cash')
        setCustomerPaid('')
        setCheckoutNote('')
        setError(null)
        setVoucherError(null)
        setSuccessMessage(null)
    }

    const handleApplyVoucherAdmin = async (overrideCode) => {
        const codeToApply = (typeof overrideCode === 'string' ? overrideCode : discountCode).trim()
        if (!order || !codeToApply) return
        setVoucherLoading(true)
        setVoucherError(null)
        try {
            const updated = await ordersService.applyVoucher(order.id, codeToApply)
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            setDiscountCode(codeToApply)
            setSuccessMessage(`Áp dụng mã giảm giá ${codeToApply.toUpperCase()} thành công!`)
        } catch (err) {
            setVoucherError(err?.response?.data?.message || 'Không thể áp dụng mã giảm giá')
        } finally {
            setVoucherLoading(false)
        }
    }

    const handleRemoveVoucherAdmin = async () => {
        if (!order) return
        setVoucherLoading(true)
        setVoucherError(null)
        try {
            const updated = await ordersService.removeVoucher(order.id)
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
            setDiscountCode('')
            setSuccessMessage('Đã hủy mã giảm giá thành công')
        } catch (err) {
            setVoucherError(err?.response?.data?.message || 'Không thể hủy mã giảm giá')
        } finally {
            setVoucherLoading(false)
        }
    }

    // ──────────────────────────────────────────────────────────
    // XỬ LÝ HỦY MÓN
    // ──────────────────────────────────────────────────────────
    const openCancelModal = (item) => {
        setCancelModalItem(item)
        setCancelReason(QUICK_CANCEL_REASONS[0])
        setCustomCancelReason('')
    }

    const handleConfirmCancelItem = async () => {
        if (!order || !cancelModalItem) return
        setCancelLoading(true)
        const finalReason =
            cancelReason === 'Lý do khác'
                ? customCancelReason.trim() || 'Lý do khác'
                : cancelReason
        try {
            const updatedOrder = await ordersService.cancelOrderItem(
                order.id,
                cancelModalItem.id,
                finalReason
            )
            setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)))
            setSuccessMessage(
                `Đã hủy món "${cancelModalItem.food?.name}" (${cancelModalItem.quantity} phần) thành công!`
            )
            setCancelModalItem(null)
        } catch (err) {
            alert(err?.response?.data?.message || 'Không thể hủy món ăn. Vui lòng thử lại.')
        } finally {
            setCancelLoading(false)
        }
    }

    const handleCheckout = async () => {
        if (!order) return

        // Nếu chọn Ví điện tử (VNPay) → mở modal QR thay vì checkout trực tiếp
        if (selectedPaymentMethod === 'ewallet') {
            handleOpenVnpayModal()
            return
        }

        setSubmitting(true)
        setError(null)
        try {
            await ordersService.checkout(order.id, selectedPaymentMethod)
            const tableCode = order.table?.code
            const baseMsg = `Đã thanh toán thành công đơn ${order.code} — bàn ${tableCode || 'Mang về'}.`
            const reservationMsg = tableCode
                ? ' Đặt bàn liên kết (nếu có) đã được tự động hoàn thành.'
                : ''
            setSuccessMessage(baseMsg + reservationMsg)
            await fetchActiveOrders(true)
            if (currentTab === 'history') fetchHistoryOrders()
        } catch (err) {
            setError(err?.response?.data?.message || 'Thanh toán không thành công. Vui lòng thử lại.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleOpenVnpayModal = async () => {
        if (!order) return
        setVnpayLoading(true)
        setVnpayError(null)
        setVnpayStatus('idle')
        try {
            const data = await ordersService.initVnpay(order.id)
            // Tạo QR code từ paymentUrl
            const qrDataUrl = await QRCode.toDataURL(data.paymentUrl, {
                width: 260,
                margin: 2,
                color: { dark: '#0f172a', light: '#ffffff' },
            })
            setVnpayModal({ ...data, qrDataUrl })
            setVnpayStatus('pending')
        } catch (err) {
            setVnpayError(err?.response?.data?.message || 'Không thể tạo link thanh toán VNPay. Vui lòng thử lại.')
        } finally {
            setVnpayLoading(false)
        }
    }

    const handleOpenVnpayWindow = () => {
        if (!vnpayModal?.paymentUrl) return
        const win = window.open(vnpayModal.paymentUrl, '_blank', 'width=900,height=700,noopener')
        vnpayWindowRef.current = win
    }

    const handleVnpayTestSuccess = async () => {
        if (!order) return
        setVnpayStatus('success')
        try {
            await ordersService.checkout(order.id, 'ewallet')
            const tableCode = order.table?.code
            setSuccessMessage(
                `Đã thanh toán thành công qua VNPay — đơn ${order.code}` +
                (tableCode ? ` — bàn ${tableCode}.` : '.')
            )
            await fetchActiveOrders(true)
            if (currentTab === 'history') fetchHistoryOrders()
        } catch (_) { }
        setTimeout(() => {
            setVnpayModal(null)
            setVnpayStatus('idle')
        }, 2500)
    }

    const handleCloseVnpayModal = () => {
        setVnpayModal(null)
        setVnpayStatus('idle')
        setVnpayError(null)
        if (vnpayWindowRef.current) vnpayWindowRef.current.close()
    }

    const handleEndTable = async () => {
        if (!order) return
        if (
            !window.confirm(
                `Bạn có chắc chắn muốn kết thúc / hoàn tất đơn ${order.code} của bàn ${order.table?.code}?`
            )
        )
            return
        setSubmitting(true)
        try {
            await ordersService.updateStatus(order.id, 'completed')
            setSuccessMessage(`Đã kết thúc đơn ${order.code} cho bàn ${order.table?.code}.`)
            await fetchActiveOrders(true)
            if (currentTab === 'history') fetchHistoryOrders()
        } catch (err) {
            setError(err?.response?.data?.message || 'Không thể kết thúc bàn. Vui lòng thử lại.')
        } finally {
            setSubmitting(false)
        }
    }

    // In hóa đơn
    const handlePrintOrder = (orderToPrint) => {
        setPrintOrderData(orderToPrint)
        setTimeout(() => {
            window.print()
        }, 150)
    }

    // ──────────────────────────────────────────────────────────
    // THỐNG KÊ LỊCH SỬ ĐƠN HÀNG
    // ──────────────────────────────────────────────────────────
    const historyStats = useMemo(() => {
        const totalOrders = historyOrders.length
        const completedOrders = historyOrders.filter((o) => o.status === 'completed')
        const cancelledOrders = historyOrders.filter((o) => o.status === 'cancelled')
        const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.finalAmount || 0), 0)

        return {
            total: totalOrders,
            completed: completedOrders.length,
            cancelled: cancelledOrders.length,
            revenue: totalRevenue,
        }
    }, [historyOrders])

    return (
        <div className="mx-auto max-w-6xl p-6">

            {/* ============================================================ */}
            {/* VNPAY MODAL — QR Code Thanh toán                              */}
            {/* ============================================================ */}
            {(vnpayModal || vnpayLoading || vnpayError) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="relative w-full max-w-sm rounded-2xl bg-paper shadow-2xl border border-border overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 border border-red-200">
                                    <span className="text-base">🏦</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-ink">Thanh toán VNPay</p>
                                    {vnpayModal && (
                                        <p className="text-[11px] text-muted">Đơn #{vnpayModal.code} — {formatVnd(vnpayModal.amount)}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseVnpayModal}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-5">
                            {/* Loading khi khởi tạo */}
                            {vnpayLoading && (
                                <div className="flex flex-col items-center gap-3 py-8">
                                    <Loader2 size={32} className="animate-spin text-red-500" />
                                    <p className="text-sm text-muted">Đang tạo link thanh toán VNPay...</p>
                                </div>
                            )}

                            {/* Lỗi */}
                            {vnpayError && !vnpayLoading && (
                                <div className="flex flex-col items-center gap-3 py-6">
                                    <div className="text-4xl">❌</div>
                                    <p className="text-center text-sm font-medium text-clay">{vnpayError}</p>
                                    <button
                                        type="button"
                                        onClick={handleOpenVnpayModal}
                                        className="mt-1 flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-paper hover:bg-ink-soft"
                                    >
                                        <RefreshCw size={13} /> Thử lại
                                    </button>
                                </div>
                            )}

                            {/* Thành công */}
                            {vnpayStatus === 'success' && (
                                <div className="flex flex-col items-center gap-3 py-8">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-4xl animate-bounce">
                                        ✅
                                    </div>
                                    <p className="text-base font-bold text-green-700">Thanh toán thành công!</p>
                                    <p className="text-center text-xs text-muted">Đơn hàng đã được cập nhật. Modal sẽ đóng tự động...</p>
                                </div>
                            )}

                            {/* QR Code chính */}
                            {vnpayModal && vnpayStatus === 'pending' && !vnpayLoading && (
                                <>
                                    {/* QR */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="rounded-xl border-2 border-red-100 bg-white p-2 shadow-inner">
                                            <img
                                                src={vnpayModal.qrDataUrl}
                                                alt="VNPay QR Code"
                                                className="h-[200px] w-[200px] object-contain"
                                            />
                                        </div>
                                        <p className="text-center text-[11px] text-muted">
                                            Dùng app ngân hàng / VNPay quét mã QR
                                        </p>
                                    </div>

                                    {/* Số tiền nổi bật */}
                                    <div className="mt-3 rounded-xl bg-red-50 border border-red-100 py-2.5 px-4 text-center">
                                        <p className="text-xs text-muted mb-0.5">Số tiền thanh toán</p>
                                        <p className="font-mono text-xl font-bold text-red-600">{formatVnd(vnpayModal.amount)}</p>
                                    </div>

                                    {/* Thẻ test NCB */}
                                    <details className="mt-3 rounded-xl border border-border bg-surface">
                                        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-ink-soft select-none">
                                            🧪 Thông tin thẻ Test Sandbox (NCB)
                                        </summary>
                                        <div className="px-3 pb-3 pt-1 space-y-1 text-[11px] text-ink-soft font-mono">
                                            <div className="flex justify-between"><span>Ngân hàng</span><span className="font-bold text-ink">NCB</span></div>
                                            <div className="flex justify-between"><span>Số thẻ</span><span className="font-bold text-ink select-all">9704198526191432198</span></div>
                                            <div className="flex justify-between"><span>Chủ thẻ</span><span className="font-bold text-ink">NGUYEN VAN A</span></div>
                                            <div className="flex justify-between"><span>Ngày phát hành</span><span className="font-bold text-ink">07/15</span></div>
                                            <div className="flex justify-between"><span>OTP</span><span className="font-bold text-green-700">123456</span></div>
                                        </div>
                                    </details>

                                    {/* Các nút hành động */}
                                    <div className="mt-4 space-y-2">
                                        <button
                                            type="button"
                                            onClick={handleOpenVnpayWindow}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-500 bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition-colors shadow-sm"
                                        >
                                            <span>🔗</span> Mở cổng thanh toán VNPay Sandbox
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleVnpayTestSuccess}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-300 bg-green-50 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                                        >
                                            <CheckCircle2 size={14} /> Mô phỏng thanh toán thành công (Demo)
                                        </button>
                                    </div>
                                    <p className="mt-2 text-center text-[10px] text-muted italic">
                                        Website sẽ tự động cập nhật sau khi VNPay xác nhận giao dịch
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header & Tabs */}

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-lg font-semibold text-ink">Quản lý Đặt món & Thanh toán</h1>
                    <p className="text-xs text-muted">Phục vụ gọi món tại bàn, hủy món và tra cứu lịch sử hóa đơn</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Switcher Tab */}
                    <div className="flex rounded-xl bg-surface border border-border p-1">
                        <button
                            type="button"
                            onClick={() => setCurrentTab('active')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${currentTab === 'active'
                                ? 'bg-paper text-ink shadow-xs border border-border/80'
                                : 'text-muted hover:text-ink'
                                }`}
                        >
                            <Utensils size={14} className={currentTab === 'active' ? 'text-teal' : ''} />
                            Đang phục vụ
                            {orders.length > 0 && (
                                <span className="ml-1 rounded-full bg-teal/15 px-1.5 py-0.2 text-[10px] font-bold text-teal">
                                    {orders.length}
                                </span>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentTab('history')}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${currentTab === 'history'
                                ? 'bg-paper text-ink shadow-xs border border-border/80'
                                : 'text-muted hover:text-ink'
                                }`}
                        >
                            <History size={14} className={currentTab === 'history' ? 'text-teal' : ''} />
                            Lịch sử thanh toán
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (currentTab === 'active') fetchActiveOrders()
                            else fetchHistoryOrders()
                        }}
                        disabled={loading || historyLoading}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-paper px-3 py-2 text-xs font-medium text-ink-soft hover:bg-black/[0.03] transition-all"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw size={14} className={loading || historyLoading ? 'animate-spin text-teal' : ''} />
                    </button>
                </div>
            </div>

            {/* Thông báo Real-time Socket */}
            {socketNotification && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <Bell size={16} className="animate-bounce text-amber-600" />
                        <span>{socketNotification}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSocketNotification(null)}
                        className="text-amber-600 hover:text-amber-800"
                    >
                        ✕
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="mb-4 flex items-center justify-between rounded-lg border border-teal/30 bg-teal-light px-4 py-2.5 text-xs font-medium text-teal">
                    <span>{successMessage}</span>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage(null)}
                        className="text-teal hover:text-teal-dark font-bold"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 1: ĐANG PHỤC VỤ (ACTIVE ORDERS / TẠM TÍNH)            */}
            {/* ========================================================= */}
            {currentTab === 'active' && (
                <div>
                    {/* Thanh chuyển đổi giữa các bàn đang có đơn */}
                    {orders.length > 0 && (
                        <div className="mb-5 flex flex-wrap gap-2">
                            {orders.map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => selectOrder(o.id)}
                                    className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${o.id === selectedOrderId
                                        ? 'border-ink bg-ink text-paper shadow-sm'
                                        : 'border-border bg-paper text-ink-soft hover:bg-black/[0.03]'
                                        }`}
                                >
                                    Bàn {o.table?.code || 'Khác'}
                                    {o.paymentRequested && (
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading && orders.length === 0 && (
                        <div className="flex items-center justify-center p-12 text-sm text-muted">
                            <Loader2 size={20} className="mr-2 animate-spin text-ink-soft" />
                            Đang tải danh sách đơn hàng...
                        </div>
                    )}

                    {!loading && orders.length === 0 && (
                        <div className="rounded-xl border border-border bg-surface p-12 text-center">
                            <Utensils size={36} className="mx-auto mb-3 text-muted/50" />
                            <p className="text-sm font-medium text-ink">Hiện tại không có bàn nào đang sử dụng dịch vụ.</p>
                            <p className="mt-1 text-xs text-muted">
                                Các đơn hàng mới từ khách quét mã QR tại bàn sẽ tự động hiển thị tại đây.
                            </p>
                        </div>
                    )}

                    {order && (
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.65fr_1fr]">
                            {/* Cột trái: Thông tin bàn & Danh sách món */}
                            <div className="space-y-5">
                                {/* Thông tin bàn */}
                                <div className="rounded-xl border border-border bg-paper p-4 shadow-xs">
                                    {order.paymentRequested && (
                                        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700 flex items-center gap-2">
                                            <Bell size={16} className="text-red-500 animate-bounce" />
                                            <span>
                                                Khách hàng tại bàn này vừa nhấn <strong>Yêu cầu thanh toán</strong>!
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 className="text-sm font-semibold text-ink">
                                            Thông tin bàn ({order.code})
                                        </h2>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleEndTable}
                                                className="flex items-center gap-1 rounded-lg border border-clay/30 px-2.5 py-1.5 text-[11px] font-medium text-clay hover:bg-clay-light"
                                            >
                                                <XCircle size={12} /> Kết thúc bàn
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                        <div className="col-span-2 flex items-center gap-2">
                                            <span className="font-semibold text-ink">
                                                Bàn: {order.table?.code || 'Chưa xếp'}
                                            </span>
                                            <span className="rounded-full border border-clay/30 bg-clay-light px-2 py-0.5 text-[10px] font-semibold text-clay">
                                                Đang sử dụng ({order.status})
                                            </span>
                                        </div>
                                        {order.table?.capacity && (
                                            <span className="text-ink-soft">
                                                Sức chứa: {order.table.capacity} người
                                            </span>
                                        )}
                                        {order.createdAt && (
                                            <span className="text-ink-soft">
                                                Thời gian vào: {formatDateTime(order.createdAt)}
                                            </span>
                                        )}
                                        {(order.customerName || order.customerPhone) && (
                                            <span className="col-span-2 text-ink-soft">
                                                Khách hàng: {order.customerName || 'Khách vãng lai'}
                                                {order.customerPhone ? ` | ${order.customerPhone}` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Danh sách món ăn đang phục vụ (hiển thị cả món hủy để đối soát tạm tính) */}
                                <div className="rounded-xl border border-border bg-paper p-4 shadow-xs">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h2 className="text-sm font-semibold text-ink">
                                            Danh sách món ăn ({items.length})
                                        </h2>
                                        <span className="text-[11px] text-muted">
                                            (Tạm tính bao gồm món hủy đối soát)
                                        </span>
                                    </div>

                                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                                        <Search size={14} className="text-muted" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Tìm món theo tên..."
                                            className="w-full bg-transparent text-xs outline-none"
                                        />
                                    </div>

                                    {categories.length > 0 && (
                                        <div className="mb-3 flex flex-wrap gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setActiveCategory('all')}
                                                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${activeCategory === 'all'
                                                    ? 'bg-ink text-paper'
                                                    : 'border border-border text-ink-soft hover:bg-black/[0.03]'
                                                    }`}
                                            >
                                                Tất cả
                                            </button>
                                            {categories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setActiveCategory(cat)}
                                                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${activeCategory === cat
                                                        ? 'bg-ink text-paper'
                                                        : 'border border-border text-ink-soft hover:bg-black/[0.03]'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="overflow-hidden rounded-xl border border-border">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-surface text-ink-soft">
                                                    <th className="px-3 py-2 text-left font-medium">Hình ảnh</th>
                                                    <th className="px-3 py-2 text-left font-medium">Món ăn</th>
                                                    <th className="px-3 py-2 text-right font-medium">Đơn giá</th>
                                                    <th className="px-3 py-2 text-center font-medium">Số lượng</th>
                                                    <th className="px-3 py-2 text-right font-medium">Thành tiền</th>
                                                    <th className="px-3 py-2 text-center font-medium">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredItems.map((item) => {
                                                    const isCancelled = item.status === 'cancelled'
                                                    return (
                                                        <tr
                                                            key={item.id}
                                                            className={`border-t border-border transition-colors ${isCancelled
                                                                ? 'bg-red-50/40 opacity-60'
                                                                : 'hover:bg-black/[0.02]'
                                                                }`}
                                                        >
                                                            <td className="px-3 py-2">
                                                                <FoodItemThumbnail
                                                                    src={item.food?.thumbnailUrl}
                                                                    alt={item.food?.name}
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span
                                                                        className={`font-semibold text-ink ${isCancelled ? 'line-through text-muted' : ''
                                                                            }`}
                                                                    >
                                                                        {item.food?.name}
                                                                    </span>
                                                                    {isCancelled && (
                                                                        <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                                                                            Đã hủy
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-muted">
                                                                    {item.food?.category}
                                                                </div>
                                                                {item.note && (
                                                                    <div
                                                                        className={`text-[10px] italic ${isCancelled
                                                                            ? 'text-red-600 font-medium'
                                                                            : 'text-amber-600'
                                                                            }`}
                                                                    >
                                                                        Ghi chú: {item.note}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td
                                                                className={`px-3 py-2 text-right font-mono text-ink-soft ${isCancelled ? 'line-through' : ''
                                                                    }`}
                                                            >
                                                                {formatVnd(item.price)}
                                                            </td>
                                                            <td
                                                                className={`px-3 py-2 text-center font-semibold text-ink ${isCancelled ? 'line-through text-muted' : ''
                                                                    }`}
                                                            >
                                                                {item.quantity}
                                                            </td>
                                                            <td
                                                                className={`px-3 py-2 text-right font-mono font-medium ${isCancelled
                                                                    ? 'line-through text-muted'
                                                                    : 'text-ink'
                                                                    }`}
                                                            >
                                                                {formatVnd(Number(item.price) * item.quantity)}
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                {isCancelled ? (
                                                                    <span className="text-[11px] text-muted italic">
                                                                        Không tính tiền
                                                                    </span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openCancelModal(item)}
                                                                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/70 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                                                                        title="Hủy món này"
                                                                    >
                                                                        <Trash2 size={12} /> Hủy món
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                                {filteredItems.length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="px-3 py-10 text-center text-muted">
                                                            Không có món phù hợp.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {order.note && (
                                        <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-ink-soft">
                                            Ghi chú chung của đơn: {order.note}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Cột phải: Thanh toán */}
                            <div className="h-fit rounded-xl border border-border bg-paper p-4 shadow-xs">
                                <h2 className="mb-3 text-sm font-semibold text-ink">Thanh toán</h2>

                                <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3 text-xs">
                                    <div className="flex justify-between text-ink-soft">
                                        <span>Tạm tính (món đang dùng)</span>
                                        <span className="font-mono">{formatVnd(subtotal)}</span>
                                    </div>
                                    {vatAmount > 0 && (
                                        <div className="flex justify-between text-ink-soft">
                                            <span>Thuế VAT</span>
                                            <span className="font-mono">{formatVnd(vatAmount)}</span>
                                        </div>
                                    )}
                                    {serviceFeeAmount > 0 && (
                                        <div className="flex justify-between text-ink-soft">
                                            <span>Phí phục vụ</span>
                                            <span className="font-mono">{formatVnd(serviceFeeAmount)}</span>
                                        </div>
                                    )}
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-ink-soft">
                                            <span>Giảm giá</span>
                                            <span className="font-mono text-teal">- {formatVnd(discountAmount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3" ref={voucherDropdownRef}>
                                    <label className="mb-1 block text-xs font-semibold text-ink-soft">
                                        Mã giảm giá / Voucher
                                    </label>
                                    {order?.promotionCode ? (
                                        <div className="flex items-center justify-between rounded-lg border border-teal/30 bg-teal/5 px-3 py-2 text-xs">
                                            <div className="flex items-center gap-1.5 font-semibold text-teal-dark">
                                                <Tag size={13} className="text-teal" />
                                                <span className="rounded bg-teal/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-teal">
                                                    {order.promotionCode}
                                                </span>
                                                <span className="text-[11px] text-teal-dark font-medium">
                                                    (-{formatVnd(discountAmount)})
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveVoucherAdmin}
                                                disabled={voucherLoading}
                                                className="text-[11px] font-medium text-red-600 hover:text-red-700 hover:underline"
                                            >
                                                {voucherLoading ? 'Đang hủy...' : 'Hủy mã'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative space-y-1">
                                            <div className="flex gap-1.5">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={discountCode}
                                                        onFocus={() => setIsVoucherDropdownOpen(true)}
                                                        onChange={(e) => {
                                                            setDiscountCode(e.target.value.toUpperCase())
                                                            setIsVoucherDropdownOpen(true)
                                                            setVoucherError(null)
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                setIsVoucherDropdownOpen(false)
                                                                handleApplyVoucherAdmin()
                                                            }
                                                        }}
                                                        placeholder={
                                                            usablePromotions.length > 0
                                                                ? `Chọn hoặc nhập mã (${usablePromotions.length} mã khả dụng)`
                                                                : 'Nhập mã voucher...'
                                                        }
                                                        className="w-full rounded-lg border border-border bg-surface pl-3 pr-8 py-2 text-xs font-mono uppercase focus-ring"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsVoucherDropdownOpen((prev) => !prev)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink transition-colors"
                                                        tabIndex={-1}
                                                        title="Danh sách voucher khả dụng"
                                                    >
                                                        <ChevronDown
                                                            size={14}
                                                            className={`transition-transform duration-200 ${isVoucherDropdownOpen ? 'rotate-180 text-teal' : ''
                                                                }`}
                                                        />
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsVoucherDropdownOpen(false)
                                                        handleApplyVoucherAdmin()
                                                    }}
                                                    disabled={voucherLoading || !discountCode.trim()}
                                                    className="shrink-0 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-paper hover:bg-ink-soft disabled:opacity-50 transition-colors"
                                                >
                                                    {voucherLoading ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        'Áp dụng'
                                                    )}
                                                </button>
                                            </div>

                                            {/* Dropdown danh sách voucher khả dụng */}
                                            {isVoucherDropdownOpen && (
                                                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-paper p-1.5 shadow-xl text-xs space-y-0.5">
                                                    <div className="px-2 py-1 text-[10px] font-semibold text-muted border-b border-border flex items-center justify-between">
                                                        <span>Voucher đang khả dụng ({usablePromotions.length})</span>
                                                        <span className="font-normal italic">Bấm để áp dụng ngay</span>
                                                    </div>

                                                    {filteredUsablePromotions.length === 0 ? (
                                                        <div className="px-3 py-3 text-center text-xs text-muted">
                                                            {usablePromotions.length === 0
                                                                ? 'Không có voucher nào khả dụng lúc này'
                                                                : 'Không tìm thấy mã voucher phù hợp'}
                                                        </div>
                                                    ) : (
                                                        filteredUsablePromotions.map((promo) => (
                                                            <button
                                                                key={promo.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setDiscountCode(promo.code)
                                                                    setIsVoucherDropdownOpen(false)
                                                                    handleApplyVoucherAdmin(promo.code)
                                                                }}
                                                                disabled={voucherLoading}
                                                                className="w-full flex items-center justify-between gap-2 rounded-lg p-2 text-left hover:bg-teal/10 transition-colors group"
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="rounded bg-teal/15 px-1.5 py-0.5 font-mono text-[11px] font-bold text-teal group-hover:bg-teal group-hover:text-white transition-colors">
                                                                            {promo.code}
                                                                        </span>
                                                                        <span className="font-semibold text-xs text-ink truncate">
                                                                            {promo.title}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <span className="shrink-0 font-mono text-[11px] font-bold text-teal">
                                                                    {promo.discountType === 'percent'
                                                                        ? `Giảm ${promo.discountValue}%`
                                                                        : `Giảm ${formatVnd(promo.discountValue)}`}
                                                                </span>
                                                            </button>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            {voucherError && (
                                                <p className="text-[11px] text-red-500 pt-0.5">{voucherError}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 rounded-xl border border-border bg-surface p-3">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xs font-semibold text-ink-soft">Tổng thanh toán</span>
                                        <span className="font-mono text-lg font-bold text-teal">
                                            {formatVnd(totalAmount)}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-[10px] italic text-muted">
                                        Bằng chữ: {amountToVietnameseWords(totalAmount)}
                                    </p>
                                </div>

                                <div className="mt-4 space-y-2">
                                    <label className="block text-xs font-semibold text-ink-soft">
                                        Phương thức thanh toán
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {PAYMENT_METHODS.map((pm) => {
                                            const Icon = pm.icon
                                            const isSelected = selectedPaymentMethod === pm.id
                                            return (
                                                <button
                                                    key={pm.id}
                                                    type="button"
                                                    onClick={() => setSelectedPaymentMethod(pm.id)}
                                                    className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-[11px] font-medium border transition-all ${isSelected
                                                        ? 'border-ink bg-black/[0.04] font-bold shadow-xs'
                                                        : 'border-border bg-paper hover:bg-black/[0.03] text-ink-soft'
                                                        }`}
                                                >
                                                    <div className={`rounded-lg border p-1.5 ${pm.color}`}>
                                                        <Icon size={16} />
                                                    </div>
                                                    <span className="text-center leading-tight">{pm.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {selectedPaymentMethod === 'cash' && (
                                    <div className="mt-4 space-y-2">
                                        <label className="block text-xs font-semibold text-ink-soft">
                                            Khách thanh toán
                                        </label>
                                        <input
                                            type="number"
                                            value={customerPaid}
                                            onChange={(e) => setCustomerPaid(e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-right font-mono text-sm font-semibold focus-ring"
                                        />
                                        <div className="flex justify-between text-xs">
                                            <span className="text-ink-soft">Tiền thừa trả khách</span>
                                            <span
                                                className={`font-mono font-bold ${change >= 0 ? 'text-teal' : 'text-clay'
                                                    }`}
                                            >
                                                {formatVnd(Math.abs(change))}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {selectedPaymentMethod === 'ewallet' && (
                                    <p className="mt-4 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-[11px] text-pink-700">
                                        Khi bấm "Thanh toán & Kết thúc", hệ thống sẽ mở modal quét mã QR VNPay để hoàn tất giao dịch.
                                    </p>
                                )}

                                <div className="mt-4 space-y-1.5">
                                    <label className="block text-xs font-semibold text-ink-soft">Ghi chú thanh toán</label>
                                    <textarea
                                        value={checkoutNote}
                                        onChange={(e) => setCheckoutNote(e.target.value)}
                                        placeholder="Nhập ghi chú (nếu có)..."
                                        rows={2}
                                        className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-xs focus-ring"
                                    />
                                </div>

                                {error && (
                                    <p className="mt-3 rounded-lg border border-clay/30 bg-clay-light px-3 py-2 text-xs font-medium text-clay">
                                        {error}
                                    </p>
                                )}

                                <div className="mt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handlePrintOrder(order)}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-medium text-ink-soft hover:bg-black/[0.03] focus-ring"
                                    >
                                        <Printer size={14} /> In tạm tính
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCheckout}
                                        disabled={submitting}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink py-2.5 text-xs font-bold text-paper hover:bg-ink-soft focus-ring disabled:opacity-50"
                                    >
                                        {submitting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <CheckCircle2 size={16} />
                                        )}
                                        Thanh toán & Kết thúc
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: LỊCH SỬ ĐƠN HÀNG (HISTORY ORDERS)                  */}
            {/* ========================================================= */}
            {currentTab === 'history' && (
                <div className="space-y-5">
                    {/* Thẻ thống kê nhanh */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-border bg-paper p-3.5 shadow-xs">
                            <div className="flex items-center justify-between text-muted">
                                <span className="text-xs font-medium">Tổng số đơn</span>
                                <Receipt size={16} className="text-ink-soft" />
                            </div>
                            <div className="mt-2 text-xl font-bold text-ink">{historyStats.total}</div>
                            <div className="text-[11px] text-muted">Trong khoảng lọc</div>
                        </div>

                        <div className="rounded-xl border border-border bg-paper p-3.5 shadow-xs">
                            <div className="flex items-center justify-between text-muted">
                                <span className="text-xs font-medium">Đơn hoàn thành</span>
                                <CheckCircle2 size={16} className="text-teal" />
                            </div>
                            <div className="mt-2 text-xl font-bold text-teal">{historyStats.completed}</div>
                            <div className="text-[11px] text-teal-dark font-medium">
                                {historyStats.total > 0
                                    ? `${Math.round((historyStats.completed / historyStats.total) * 100)}% thành công`
                                    : '—'}
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-paper p-3.5 shadow-xs">
                            <div className="flex items-center justify-between text-muted">
                                <span className="text-xs font-medium">Đơn đã hủy</span>
                                <Ban size={16} className="text-red-500" />
                            </div>
                            <div className="mt-2 text-xl font-bold text-red-600">{historyStats.cancelled}</div>
                            <div className="text-[11px] text-red-500 font-medium">
                                {historyStats.total > 0
                                    ? `${Math.round((historyStats.cancelled / historyStats.total) * 100)}% hủy đơn`
                                    : '—'}
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-paper p-3.5 shadow-xs">
                            <div className="flex items-center justify-between text-muted">
                                <span className="text-xs font-medium">Doanh thu thực</span>
                                <DollarSign size={16} className="text-teal" />
                            </div>
                            <div className="mt-2 text-lg font-bold text-teal truncate">
                                {formatVnd(historyStats.revenue)}
                            </div>
                            <div className="text-[11px] text-muted">Từ đơn hoàn tất</div>
                        </div>
                    </div>

                    {/* Bộ lọc lịch sử */}
                    <div className="rounded-xl border border-border bg-paper p-4 shadow-xs space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                            {/* Ô tìm kiếm */}
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
                                <Search size={14} className="text-muted shrink-0" />
                                <input
                                    type="text"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    placeholder="Tìm mã đơn, SĐT, khách, bàn..."
                                    className="w-full bg-transparent text-xs outline-none"
                                />
                            </div>

                            {/* Lọc Trạng thái */}
                            <div>
                                <select
                                    value={historyStatus}
                                    onChange={(e) => setHistoryStatus(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink focus-ring"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="cancelled">Đã hủy</option>
                                    <option value="pending,confirmed,preparing,served">Đang phục vụ</option>
                                </select>
                            </div>

                            {/* Lọc Phương thức thanh toán */}
                            <div>
                                <select
                                    value={historyPaymentMethodFilter}
                                    onChange={(e) => setHistoryPaymentMethodFilter(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink focus-ring"
                                >
                                    <option value="all">Tất cả phương thức</option>
                                    <option value="cash">Tiền mặt</option>
                                    <option value="transfer">Chuyển khoản</option>
                                    <option value="card">Thẻ ngân hàng</option>
                                    <option value="ewallet">Ví điện tử</option>
                                </select>
                            </div>

                            {/* Lọc Khoảng ngày */}
                            <div>
                                <select
                                    value={historyDatePreset}
                                    onChange={(e) => setHistoryDatePreset(e.target.value)}
                                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink focus-ring"
                                >
                                    <option value="all">Tất cả thời gian</option>
                                    <option value="today">Hôm nay</option>
                                    <option value="7days">7 ngày qua</option>
                                    <option value="30days">30 ngày qua</option>
                                    <option value="custom">Tùy chọn ngày...</option>
                                </select>
                            </div>
                        </div>

                        {/* Chọn ngày tùy chỉnh */}
                        {historyDatePreset === 'custom' && (
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                                <span className="text-muted">Từ ngày:</span>
                                <input
                                    type="date"
                                    value={historyStartDate}
                                    onChange={(e) => setHistoryStartDate(e.target.value)}
                                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus-ring"
                                />
                                <span className="text-muted">Đến ngày:</span>
                                <input
                                    type="date"
                                    value={historyEndDate}
                                    onChange={(e) => setHistoryEndDate(e.target.value)}
                                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink focus-ring"
                                />
                            </div>
                        )}
                    </div>

                    {/* Bảng danh sách đơn hàng lịch sử */}
                    <div className="rounded-xl border border-border bg-paper shadow-xs overflow-hidden">
                        {historyLoading ? (
                            <div className="flex items-center justify-center p-12 text-sm text-muted">
                                <Loader2 size={20} className="mr-2 animate-spin text-ink-soft" />
                                Đang tải dữ liệu lịch sử đơn hàng...
                            </div>
                        ) : historyOrders.length === 0 ? (
                            <div className="p-12 text-center text-muted">
                                <FileText size={32} className="mx-auto mb-2 opacity-40" />
                                <p className="text-sm font-medium">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-border bg-surface text-ink-soft font-medium">
                                            <th className="px-4 py-3">Mã đơn</th>
                                            <th className="px-4 py-3">Bàn / Loại</th>
                                            <th className="px-4 py-3">Khách hàng</th>
                                            <th className="px-4 py-3">Thời gian</th>
                                            <th className="px-4 py-3 text-center">Số món</th>
                                            <th className="px-4 py-3 text-right">Tổng thanh toán</th>
                                            <th className="px-4 py-3">Phương thức</th>
                                            <th className="px-4 py-3 text-center">Trạng thái</th>
                                            <th className="px-4 py-3 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {historyOrders.map((histOrder) => {
                                            const isCompleted = histOrder.status === 'completed'
                                            const isCancelled = histOrder.status === 'cancelled'

                                            // Khi đơn hoàn thành: chỉ tính số lượng các món hoàn thành (không tính món hủy)
                                            const validItems = (histOrder.orderItems || []).filter(
                                                (i) => i.status !== 'cancelled'
                                            )
                                            const totalItemsCount = isCompleted
                                                ? validItems.reduce((s, i) => s + Number(i.quantity || 1), 0)
                                                : (histOrder.orderItems || []).reduce(
                                                    (s, i) => s + Number(i.quantity || 1),
                                                    0
                                                )

                                            let statusBadge = (
                                                <span className="rounded-full bg-saffron-light px-2.5 py-0.5 text-[10px] font-semibold text-saffron-dark">
                                                    Đang phục vụ
                                                </span>
                                            )
                                            if (isCompleted) {
                                                statusBadge = (
                                                    <span className="rounded-full bg-teal-light px-2.5 py-0.5 text-[10px] font-semibold text-teal">
                                                        Hoàn thành
                                                    </span>
                                                )
                                            } else if (isCancelled) {
                                                statusBadge = (
                                                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-semibold text-red-700">
                                                        Đã hủy
                                                    </span>
                                                )
                                            }

                                            return (
                                                <tr
                                                    key={histOrder.id}
                                                    className="hover:bg-black/[0.02] transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-mono font-semibold text-ink">
                                                        {histOrder.code}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-semibold text-ink">
                                                            {histOrder.table ? `Bàn ${histOrder.table.code}` : 'Mang về'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-ink">
                                                            {histOrder.customerName || 'Khách vãng lai'}
                                                        </div>
                                                        {histOrder.customerPhone && (
                                                            <div className="text-[10px] text-muted">
                                                                {histOrder.customerPhone}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-ink-soft whitespace-nowrap">
                                                        {formatDateTime(histOrder.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-medium">
                                                        <span>{totalItemsCount} món</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono">
                                                        <div className="font-bold text-ink">
                                                            {formatVnd(histOrder.finalAmount ?? histOrder.totalAmount)}
                                                        </div>
                                                        {Number(histOrder.discountAmount) > 0 && (
                                                            <div className="text-[10px] text-teal">
                                                                Giảm {formatVnd(histOrder.discountAmount)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="capitalize text-ink-soft">
                                                            {histOrder.paymentMethod === 'cash'
                                                                ? 'Tiền mặt'
                                                                : histOrder.paymentMethod === 'card'
                                                                    ? 'Thẻ'
                                                                    : histOrder.paymentMethod === 'transfer'
                                                                        ? 'Chuyển khoản'
                                                                        : histOrder.paymentMethod === 'ewallet'
                                                                            ? 'Ví điện tử'
                                                                            : histOrder.paymentMethod || 'Chưa TT'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">{statusBadge}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedHistoryOrder(histOrder)
                                                                    setDetailModalOpen(true)
                                                                }}
                                                                className="rounded-lg border border-border p-1.5 text-ink-soft hover:bg-black/[0.04] hover:text-ink transition-colors"
                                                                title="Xem chi tiết đơn hàng"
                                                            >
                                                                <Eye size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handlePrintOrder(histOrder)}
                                                                className="rounded-lg border border-border p-1.5 text-ink-soft hover:bg-black/[0.04] hover:text-ink transition-colors"
                                                                title="In hóa đơn"
                                                            >
                                                                <Printer size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: HỦY MÓN ĂN TRONG ĐƠN (ĐANG PHỤC VỤ)               */}
            {/* ========================================================= */}
            {cancelModalItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-paper p-5 shadow-2xl space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertTriangle size={20} />
                                <h3 className="text-sm font-bold text-ink">Xác nhận Hủy Món</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCancelModalItem(null)}
                                className="rounded-lg p-1 text-muted hover:text-ink"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-xs space-y-1">
                            <p className="font-semibold text-ink">
                                Món hủy: <span className="text-red-700">{cancelModalItem.food?.name}</span>
                            </p>
                            <p className="text-ink-soft">
                                Số lượng: {cancelModalItem.quantity} phần | Đơn giá: {formatVnd(cancelModalItem.price)}
                            </p>
                            <p className="text-muted text-[11px]">
                                Tổng tiền giảm trừ: {formatVnd(Number(cancelModalItem.price) * cancelModalItem.quantity)}
                            </p>
                        </div>

                        <div className="space-y-2 text-xs">
                            <label className="block font-semibold text-ink-soft">Chọn lý do hủy:</label>
                            <div className="space-y-1.5">
                                {QUICK_CANCEL_REASONS.map((r) => (
                                    <label
                                        key={r}
                                        className="flex items-center gap-2 cursor-pointer rounded-lg border border-border p-2 hover:bg-surface transition-colors"
                                    >
                                        <input
                                            type="radio"
                                            name="cancelReason"
                                            value={r}
                                            checked={cancelReason === r}
                                            onChange={() => setCancelReason(r)}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span className="text-ink">{r}</span>
                                    </label>
                                ))}
                                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border p-2 hover:bg-surface transition-colors">
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value="Lý do khác"
                                        checked={cancelReason === 'Lý do khác'}
                                        onChange={() => setCancelReason('Lý do khác')}
                                        className="text-red-600 focus:ring-red-500"
                                    />
                                    <span className="text-ink">Lý do khác...</span>
                                </label>
                            </div>

                            {cancelReason === 'Lý do khác' && (
                                <textarea
                                    value={customCancelReason}
                                    onChange={(e) => setCustomCancelReason(e.target.value)}
                                    placeholder="Nhập chi tiết lý do hủy món..."
                                    rows={2}
                                    className="w-full rounded-lg border border-border bg-surface p-2 text-xs focus-ring"
                                />
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setCancelModalItem(null)}
                                disabled={cancelLoading}
                                className="flex-1 rounded-xl border border-border py-2 text-xs font-semibold text-ink-soft hover:bg-surface"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmCancelItem}
                                disabled={cancelLoading}
                                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                {cancelLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Trash2 size={14} />
                                )}
                                Xác nhận Hủy Món
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: CHI TIẾT ĐƠN HÀNG LỊCH SỬ                           */}
            {/* ========================================================= */}
            {detailModalOpen && selectedHistoryOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-xs">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-paper p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-ink font-mono">
                                        {selectedHistoryOrder.code}
                                    </h3>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${selectedHistoryOrder.status === 'completed'
                                            ? 'bg-teal-light text-teal'
                                            : selectedHistoryOrder.status === 'cancelled'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-saffron-light text-saffron-dark'
                                            }`}
                                    >
                                        {selectedHistoryOrder.status === 'completed'
                                            ? 'Hoàn thành'
                                            : selectedHistoryOrder.status === 'cancelled'
                                                ? 'Đã hủy'
                                                : selectedHistoryOrder.status}
                                    </span>
                                </div>
                                <p className="text-xs text-muted">
                                    Thời gian: {formatDateTime(selectedHistoryOrder.createdAt)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailModalOpen(false)}
                                className="rounded-lg p-1.5 text-muted hover:text-ink hover:bg-surface"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Thông tin bàn & khách */}
                        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-3 text-xs">
                            <div>
                                <span className="text-muted">Bàn: </span>
                                <span className="font-semibold text-ink">
                                    {selectedHistoryOrder.table ? `Bàn ${selectedHistoryOrder.table.code}` : 'Mang về'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted">Khách hàng: </span>
                                <span className="font-semibold text-ink">
                                    {selectedHistoryOrder.customerName || 'Khách vãng lai'}
                                </span>
                            </div>
                            {selectedHistoryOrder.customerPhone && (
                                <div>
                                    <span className="text-muted">Số điện thoại: </span>
                                    <span className="font-mono text-ink">{selectedHistoryOrder.customerPhone}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-muted">Phương thức TT: </span>
                                <span className="capitalize font-medium text-ink">
                                    {selectedHistoryOrder.paymentMethod || 'Chưa chọn'}
                                </span>
                            </div>
                        </div>

                        {/* Danh sách món ăn trong hóa đơn: Khi hoàn thành CHỈ hiển thị món hoàn thành */}
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-surface text-ink-soft">
                                        <th className="px-3 py-2 text-left font-medium">Món ăn</th>
                                        <th className="px-3 py-2 text-right font-medium">Đơn giá</th>
                                        <th className="px-3 py-2 text-center font-medium">SL</th>
                                        <th className="px-3 py-2 text-right font-medium">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(selectedHistoryOrder.orderItems || [])
                                        .filter((it) => {
                                            // Nếu đơn đã hoàn thành -> CHỈ hiển thị các món hoàn thành (loại bỏ món hủy)
                                            if (selectedHistoryOrder.status === 'completed') {
                                                return it.status !== 'cancelled'
                                            }
                                            return true
                                        })
                                        .map((it) => {
                                            const isCancelled = it.status === 'cancelled'
                                            return (
                                                <tr
                                                    key={it.id}
                                                    className={isCancelled ? 'bg-red-50/40 opacity-60' : ''}
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <span
                                                                className={`font-semibold text-ink ${isCancelled ? 'line-through text-muted' : ''
                                                                    }`}
                                                            >
                                                                {it.food?.name || 'Món ăn'}
                                                            </span>
                                                            {isCancelled && (
                                                                <span className="rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-600">
                                                                    Đã hủy
                                                                </span>
                                                            )}
                                                        </div>
                                                        {it.note && (
                                                            <div
                                                                className={`text-[10px] italic ${isCancelled ? 'text-red-500' : 'text-muted'
                                                                    }`}
                                                            >
                                                                {it.note}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2 text-right font-mono text-ink-soft ${isCancelled ? 'line-through' : ''
                                                            }`}
                                                    >
                                                        {formatVnd(it.price)}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2 text-center font-semibold ${isCancelled ? 'line-through text-muted' : ''
                                                            }`}
                                                    >
                                                        {it.quantity}
                                                    </td>
                                                    <td
                                                        className={`px-3 py-2 text-right font-mono font-medium ${isCancelled ? 'line-through text-muted' : 'text-ink'
                                                            }`}
                                                    >
                                                        {formatVnd(Number(it.price) * it.quantity)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                </tbody>
                            </table>
                        </div>

                        {/* Tổng kết tiền */}
                        <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3 text-xs">
                            <div className="flex justify-between text-ink-soft">
                                <span>Tạm tính (các món hoàn thành)</span>
                                <span className="font-mono">{formatVnd(selectedHistoryOrder.totalAmount)}</span>
                            </div>
                            {Number(selectedHistoryOrder.discountAmount) > 0 && (
                                <div className="flex justify-between text-ink-soft">
                                    <span>
                                        Voucher giảm giá{' '}
                                        {selectedHistoryOrder.promotionCode && (
                                            <span className="font-mono font-bold text-teal">
                                                ({selectedHistoryOrder.promotionCode})
                                            </span>
                                        )}
                                    </span>
                                    <span className="font-mono text-teal">
                                        - {formatVnd(selectedHistoryOrder.discountAmount)}
                                    </span>
                                </div>
                            )}
                            <div className="border-t border-border pt-1.5 flex justify-between font-bold text-ink">
                                <span>Tổng thanh toán thực tế</span>
                                <span className="font-mono text-sm text-teal">
                                    {formatVnd(
                                        selectedHistoryOrder.finalAmount ?? selectedHistoryOrder.totalAmount
                                    )}
                                </span>
                            </div>
                            <p className="text-[10px] italic text-muted text-right">
                                Bằng chữ:{' '}
                                {amountToVietnameseWords(
                                    selectedHistoryOrder.finalAmount ?? selectedHistoryOrder.totalAmount
                                )}
                            </p>
                        </div>

                        {/* Footer buttons */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                            <button
                                type="button"
                                onClick={() => setDetailModalOpen(false)}
                                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-surface"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handlePrintOrder(selectedHistoryOrder)
                                }}
                                className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-paper hover:bg-ink-soft shadow-xs"
                            >
                                <Printer size={14} /> In hóa đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* PRINTABLE RECEIPT TEMPLATE (Ẩn trên UI, hiện khi in)      */}
            {/* ========================================================= */}
            {printOrderData && (
                <div id="printable-receipt" className="hidden print:block print:p-6 text-black bg-white">
                    <div className="text-center pb-3 border-b border-black">
                        <h2 className="text-xl font-bold uppercase tracking-wider">DOLA RESTAURANT</h2>
                        <p className="text-xs">Ẩm thực Á - Âu sang trọng & Đậm đà</p>
                        <p className="text-[11px]">Hotline: 1900 6789 | dola-restaurant.vn</p>
                    </div>

                    <div className="py-3 text-center">
                        <h3 className="text-base font-bold uppercase">
                            {printOrderData.status === 'completed'
                                ? 'HÓA ĐƠN THANH TOÁN'
                                : 'PHIẾU TẠM TÍNH GỌI MÓN'}
                        </h3>
                        <p className="text-xs font-mono">Mã đơn: {printOrderData.code}</p>
                    </div>

                    <div className="text-xs space-y-1 pb-3 border-b border-black">
                        <div className="flex justify-between">
                            <span>Bàn: {printOrderData.table?.code || 'Mang về'}</span>
                            <span>Giờ vào: {formatDateTime(printOrderData.createdAt)}</span>
                        </div>
                        {printOrderData.customerName && (
                            <div>Khách hàng: {printOrderData.customerName}</div>
                        )}
                        {printOrderData.customerPhone && (
                            <div>Số điện thoại: {printOrderData.customerPhone}</div>
                        )}
                    </div>

                    {/* Bảng món: chỉ in các món hoàn thành thực tế */}
                    <table className="w-full my-3 text-xs">
                        <thead>
                            <tr className="border-b border-black text-left">
                                <th className="py-1">Món ăn</th>
                                <th className="py-1 text-center">SL</th>
                                <th className="py-1 text-right">Đơn giá</th>
                                <th className="py-1 text-right">T.Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(printOrderData.orderItems || printOrderData.items || []).map((it) => {
                                const isCancelled = it.status === 'cancelled'
                                if (isCancelled) return null // không in món đã hủy lên hóa đơn
                                return (
                                    <tr key={it.id} className="border-b border-gray-200">
                                        <td className="py-1 font-medium">{it.food?.name || 'Món ăn'}</td>
                                        <td className="py-1 text-center font-bold">{it.quantity}</td>
                                        <td className="py-1 text-right font-mono">{formatVnd(it.price)}</td>
                                        <td className="py-1 text-right font-mono font-bold">
                                            {formatVnd(Number(it.price) * it.quantity)}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    {/* Tổng kết tiền */}
                    <div className="text-xs space-y-1 pt-2 border-t border-black">
                        <div className="flex justify-between">
                            <span>Tạm tính:</span>
                            <span className="font-mono">{formatVnd(printOrderData.totalAmount)}</span>
                        </div>
                        {Number(printOrderData.discountAmount) > 0 && (
                            <div className="flex justify-between">
                                <span>Giảm giá voucher ({printOrderData.promotionCode}):</span>
                                <span className="font-mono">- {formatVnd(printOrderData.discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-black">
                            <span>TỔNG THANH TOÁN:</span>
                            <span className="font-mono text-base">
                                {formatVnd(printOrderData.finalAmount ?? printOrderData.totalAmount)}
                            </span>
                        </div>
                        <p className="text-[10px] italic">
                            Bằng chữ:{' '}
                            {amountToVietnameseWords(
                                printOrderData.finalAmount ?? printOrderData.totalAmount
                            )}
                        </p>
                        <div className="pt-2 text-xs flex justify-between">
                            <span>Hình thức:</span>
                            <span className="font-semibold uppercase">
                                {printOrderData.paymentMethod === 'cash'
                                    ? 'Tiền mặt'
                                    : printOrderData.paymentMethod === 'card'
                                        ? 'Thẻ ngân hàng'
                                        : printOrderData.paymentMethod === 'transfer'
                                            ? 'Chuyển khoản'
                                            : printOrderData.paymentMethod || 'Tiền mặt'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-6 text-center text-xs italic border-t border-black pt-3">
                        <p>Cảm ơn Quý khách & Hẹn gặp lại!</p>
                        <p className="text-[10px] text-gray-500">In từ hệ thống Dola POS</p>
                    </div>
                </div>
            )}
        </div>
    )
}