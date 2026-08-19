import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ShoppingCart,
    X,
    Plus,
    Minus,
    Trash2,
    Loader2,
    HandCoins,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    SearchX,
    Armchair,
    Bell,
    Flame,
    Soup,
    Salad,
    UtensilsCrossed,
    CookingPot,
    Fish,
    Beef,
    Sandwich,
    GlassWater,
    IceCreamCone,
    ImageOff,
    Check,
    Clock,
    Calendar,
    Sparkles,
} from 'lucide-react'
import { io } from 'socket.io-client'
import { getTableByCode } from '../api/publicTable'
import orderService from '../api/orders'
import foodService from '../api/foods'
import { fetchPublicCategories } from '../api/categories'
import { useAuth } from '../context/AuthContext'
import OrderFoodCard from '../components/OrderFoodCard'

const STATUS_LABELS = {
    pending: { label: 'Chờ xác nhận', color: 'bg-saffron-light text-saffron-dark border-saffron/30' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-gold/10 text-gold-dark border-gold/30' },
    preparing: { label: 'Đang chuẩn bị', color: 'bg-clay-light text-clay border-clay/30' },
    served: { label: 'Đã phục vụ', color: 'bg-jade-50 text-jade-700 border-jade-700/20' },
    completed: { label: 'Hoàn thành', color: 'bg-teal-light text-teal border-teal/30' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' },
}

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'served']
const POLL_INTERVAL_MS = 10000

// Icon danh mục — khớp theo slug trả về từ API, có fallback cho slug lạ
const CATEGORY_ICONS = {
    'khai-vi': Soup,
    salad: Salad,
    'mon-chinh': UtensilsCrossed,
    'mon-lau': CookingPot,
    'hai-san': Fish,
    'nuong-bbq': Beef,
    'com-mi': Sandwich,
    'do-uong': GlassWater,
    'trang-mieng': IceCreamCone,
}
function getCategoryIcon(slug) {
    if (slug === 'all') return Flame
    return CATEGORY_ICONS[slug] || UtensilsCrossed
}

// Cấu hình animation đồng bộ với Menu.jsx / FoodDetail.jsx
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 1, 0.5, 1] } },
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

function formatVnd(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)
}

export default function OrderPage() {
    const { code } = useParams()
    const { user } = useAuth()

    // Xác thực bàn
    const [table, setTable] = useState(null)
    const [tableLoading, setTableLoading] = useState(true)
    const [tableError, setTableError] = useState(null)

    // Menu
    const [foods, setFoods] = useState([])
    const [foodsLoading, setFoodsLoading] = useState(true)
    const [foodsError, setFoodsError] = useState(null)
    const [categories, setCategories] = useState([])
    const [activeCategory, setActiveCategory] = useState('all')
    const [search, setSearch] = useState('')

    // Giỏ hàng
    const [cart, setCart] = useState([]) // {foodId, name, price, quantity}
    const [cartOpen, setCartOpen] = useState(false)
    const [sheetVisible, setSheetVisible] = useState(false)
    const [orderNote, setOrderNote] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState(null)

    // Toast phản hồi nhanh (vd: thêm món vào giỏ)
    const [toast, setToast] = useState(null)
    const toastTimer = useRef(null)

    // Kích hoạt hiệu ứng bounce trên thanh giỏ hàng nổi mỗi khi số lượng món thay đổi
    const [cartBumpKey, setCartBumpKey] = useState(0)
    const prevCartCountRef = useRef(0)

    // Đơn hàng active hiện tại của bàn
    const [activeOrder, setActiveOrder] = useState(null)
    const [showItemsDetails, setShowItemsDetails] = useState(false)
    const [paymentRequestLoading, setPaymentRequestLoading] = useState(false)
    const [paymentRequestError, setPaymentRequestError] = useState(null)

    const fetchActiveOrder = async (tableCode) => {
        try {
            const data = await orderService.getActiveByTable(tableCode)
            setActiveOrder(data || null)
        } catch {
            // Không chặn giao diện nếu không lấy được đơn active
        }
    }

    const showQuickToast = (msg) => {
        if (toastTimer.current) clearTimeout(toastTimer.current)
        setToast(msg)
        toastTimer.current = setTimeout(() => setToast(null), 2500)
    }

    useEffect(() => {
        let ignore = false
        setTableLoading(true)
        getTableByCode(code)
            .then((data) => {
                if (!ignore) {
                    setTable(data)
                    fetchActiveOrder(code)
                }
            })
            .catch(() => {
                if (!ignore) setTableError('Mã QR không hợp lệ hoặc bàn không tồn tại. Vui lòng gọi nhân viên.')
            })
            .finally(() => {
                if (!ignore) setTableLoading(false)
            })
        return () => {
            ignore = true
        }
    }, [code])

    // Kết nối WebSocket thời gian thực cho bàn
    useEffect(() => {
        if (!code) return
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const socket = io(`${socketUrl}/orders`, {
            transports: ['websocket', 'polling'],
        })

        socket.on('connect', () => {
            socket.emit('table:join', { tableCode: code })
        })

        socket.on('orders:updated', (data) => {
            if (data?.table?.code === code || data?.tableCode === code) {
                fetchActiveOrder(code)
            }
        })

        socket.on('orders:checkout', (data) => {
            if (data?.table?.code === code || data?.tableCode === code) {
                fetchActiveOrder(code)
            }
        })

        socket.on('orders:payment-requested', (data) => {
            if (data?.table?.code === code || data?.tableCode === code) {
                fetchActiveOrder(code)
            }
        })

        return () => {
            socket.disconnect()
        }
    }, [code])

    useEffect(() => {
        if (!table) return
        let ignore = false

        Promise.all([foodService.getAll({ limit: 200 }), fetchPublicCategories()])
            .then(([foodList, categoryList]) => {
                if (ignore) return
                setFoods((foodList || []).filter((f) => f.isActive !== false))
                setCategories(categoryList || [])
            })
            .catch(() => {
                if (!ignore) setFoodsError('Có lỗi khi tải thực đơn. Vui lòng thử lại.')
            })
            .finally(() => {
                if (!ignore) setFoodsLoading(false)
            })

        return () => {
            ignore = true
        }
    }, [table])

    // Poll trạng thái làm dự phòng (fallback)
    useEffect(() => {
        if (!activeOrder || !ACTIVE_STATUSES.includes(activeOrder.status)) return

        const interval = setInterval(() => {
            fetchActiveOrder(code)
        }, POLL_INTERVAL_MS)

        return () => clearInterval(interval)
    }, [activeOrder, code])

    // Khóa scroll nền + cho phép đóng giỏ hàng bằng phím Escape khi bottom sheet mở
    useEffect(() => {
        if (!cartOpen) return
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeCart()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => {
            document.body.style.overflow = prevOverflow
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [cartOpen])

    // Hiệu ứng trượt lên cho bottom sheet giỏ hàng (chỉ áp dụng ở mobile)
    useEffect(() => {
        if (cartOpen) {
            const raf = requestAnimationFrame(() => setSheetVisible(true))
            return () => cancelAnimationFrame(raf)
        }
        setSheetVisible(false)
    }, [cartOpen])

    const closeCart = () => {
        setSheetVisible(false)
        setTimeout(() => setCartOpen(false), 200)
    }

    const showToast = (message) => {
        setToast(message)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), 1600)
    }

    const handleCallStaff = () => {
        showToast('Đã gửi yêu cầu — nhân viên sẽ tới bàn ngay')
        // TODO API: gọi endpoint thông báo nhân viên khi có, vd staffService.callToTable(code)
    }

    const allChips = useMemo(() => [{ slug: 'all', name: 'Tất cả' }, ...categories], [categories])
    const activeCategoryName = allChips.find((c) => c.slug === activeCategory)?.name || 'Món gợi ý'

    const filteredFoods = useMemo(() => {
        let list = foods.filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()))
        if (activeCategory !== 'all') {
            list = list.filter((f) => {
                if (f.category?.slug) return f.category.slug === activeCategory
                const catName = categories.find((c) => c.slug === activeCategory)?.name
                return f.categoryName === catName || f.category?.name === catName
            })
        }
        return list
    }, [foods, categories, search, activeCategory])

    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

    useEffect(() => {
        if (cartCount !== prevCartCountRef.current) {
            setCartBumpKey((k) => k + 1)
            prevCartCountRef.current = cartCount
        }
    }, [cartCount])

    const addToCart = (food, qty) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.foodId === food.id)
            if (existing) {
                return prev.map((i) => (i.foodId === food.id ? { ...i, quantity: i.quantity + qty } : i))
            }
            return [...prev, { foodId: food.id, name: food.name, price: food.price, image: food.image, quantity: qty }]
        })
        showToast(`Đã thêm ${qty} ${food.name} vào giỏ`)
    }

    const updateQty = (foodId, delta) => {
        setCart((prev) =>
            prev
                .map((i) => (i.foodId === foodId ? { ...i, quantity: i.quantity + delta } : i))
                .filter((i) => i.quantity > 0),
        )
    }

    const removeItem = (foodId) => {
        setCart((prev) => prev.filter((i) => i.foodId !== foodId))
    }

    const handleSubmitOrder = async () => {
        if (cart.length === 0) return
        setSubmitting(true)
        setSubmitError(null)
        try {
            const payload = {
                items: cart.map((i) => ({ foodId: i.foodId, quantity: i.quantity })),
                note: orderNote.trim() || undefined,
            }
            const order = await orderService.create(code, payload)
            setActiveOrder(order)
            setCart([])
            setOrderNote('')
            setSheetVisible(false)
            setTimeout(() => setCartOpen(false), 200)
        } catch (err) {
            setSubmitError(err?.response?.data?.message || 'Không gửi được đơn. Vui lòng thử lại.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleRequestPayment = async (orderId) => {
        setPaymentRequestLoading(true)
        setPaymentRequestError(null)
        try {
            const order = await orderService.requestPayment(orderId)
            setActiveOrder(order)
        } catch (err) {
            setPaymentRequestError(err?.response?.data?.message || 'Không gửi được yêu cầu thanh toán. Vui lòng thử lại.')
        } finally {
            setPaymentRequestLoading(false)
        }
    }

    // -------------------- Màn hình trạng thái bàn --------------------

    if (tableLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-ivory">
                <Loader2 className="animate-spin text-jade-700" size={28} />
            </div>
        )
    }

    if (tableError) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ivory px-6 text-center">
                <p className="text-base font-semibold text-ink">{tableError}</p>
            </div>
        )
    }

    // Phần yêu cầu thanh toán — hiển thị riêng, luôn nằm dưới cùng (dưới nút "Gọi món")
    const finalBillAmount = activeOrder ? (activeOrder.finalAmount !== undefined && activeOrder.finalAmount !== null ? Number(activeOrder.finalAmount) : Number(activeOrder.totalAmount || 0)) : 0

    const paymentSection = activeOrder && (
        <div className="mt-4 border-t border-jade-700/10 pt-3.5">
            {activeOrder.paymentStatus === 'unpaid' &&
                activeOrder.status !== 'completed' &&
                activeOrder.status !== 'cancelled' && (
                    <div className="flex flex-col gap-2">
                        {paymentRequestError && <p className="text-xs text-red-500">{paymentRequestError}</p>}
                        {activeOrder.paymentRequested ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-saffron-dark bg-saffron-light p-2.5 rounded-xl border border-saffron/30">
                                <Loader2 size={16} className="animate-spin" />
                                Đã gửi yêu cầu thanh toán ({formatVnd(finalBillAmount)})
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleRequestPayment(activeOrder.id)}
                                disabled={paymentRequestLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-jade-700 py-2.5 text-xs font-semibold text-ivory hover:bg-jade-800 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {paymentRequestLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <HandCoins size={16} />
                                )}
                                Yêu cầu thanh toán ({formatVnd(finalBillAmount)})
                            </button>
                        )}
                    </div>
                )}

            {activeOrder.paymentStatus === 'paid' && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-jade-700 bg-jade-50 p-2.5 rounded-xl border border-jade-700/20">
                    <CheckCircle2 size={16} /> Hoá đơn đã được thanh toán ({formatVnd(finalBillAmount)}) - {activeOrder.paymentMethod?.toUpperCase() || 'Tại quầy'}
                </div>
            )}
        </div>
    )

    // -------------------- Khối nội dung giỏ hàng (dùng chung cho panel desktop và bottom sheet mobile) --------------------
    const cartPanel = (
        <>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">Giỏ hàng của bạn</h2>
                <button type="button" onClick={closeCart} className="text-ink-soft hover:text-ink lg:hidden">
                    <X size={20} />
                </button>
            </div>

            {/* Đơn hàng hiện tại tại bàn — hiển thị trạng thái, món đã gọi, voucher & tiền thanh toán */}
            {activeOrder && (
                <div className="mb-4 space-y-3 rounded-xl bg-ivory-deep p-3.5 border border-jade-700/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">
                                Hoá đơn bàn #{activeOrder.code || activeOrder.id}
                            </span>
                            <div className="mt-1 space-y-0.5">
                                <p className="text-xs text-ink-soft flex items-center justify-between gap-4">
                                    <span>Tạm tính món:</span>
                                    <span className="font-semibold text-ink">{formatVnd(activeOrder.totalAmount)}</span>
                                </p>
                                {Number(activeOrder.discountAmount) > 0 && (
                                    <p className="text-xs text-jade-700 flex items-center justify-between gap-4 font-medium">
                                        <span>Giảm giá ({activeOrder.promotionCode}):</span>
                                        <span>- {formatVnd(activeOrder.discountAmount)}</span>
                                    </p>
                                )}
                                <p className="text-sm font-bold text-jade-800 flex items-center justify-between gap-4 pt-1 border-t border-jade-700/10">
                                    <span>Cần thanh toán:</span>
                                    <span className="text-jade-700">{formatVnd(finalBillAmount)}</span>
                                </p>
                            </div>
                        </div>
                        <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_LABELS[activeOrder.status]?.color || 'bg-ivory text-ink-soft'
                                }`}
                        >
                            {STATUS_LABELS[activeOrder.status]?.label || activeOrder.status}
                        </span>
                    </div>

                    {activeOrder.note && (
                        <p className="rounded-lg border border-jade-700/10 bg-ivory px-3 py-2 text-xs text-ink-soft">
                            <span className="font-semibold text-ink">Ghi chú: </span>
                            {activeOrder.note}
                        </p>
                    )}

                    {activeOrder.orderItems && activeOrder.orderItems.length > 0 && (
                        <div className="border-t border-jade-700/10 pt-2">
                            {(() => {
                                const isOrderCompleted = activeOrder.status === 'completed'
                                const displayItems = isOrderCompleted
                                    ? activeOrder.orderItems.filter((i) => i.status !== 'cancelled')
                                    : activeOrder.orderItems

                                return (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => setShowItemsDetails((prev) => !prev)}
                                            className="flex items-center justify-between w-full text-xs text-ink-soft font-medium py-1"
                                        >
                                            <span>Danh sách món đã gọi ({displayItems.length} món)</span>
                                            {showItemsDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </button>

                                        {showItemsDetails && (
                                            <div className="mt-2 space-y-2 bg-ivory p-3 rounded-xl border border-jade-700/10 text-xs">
                                                {displayItems.map((item) => {
                                                    const isCancelled = item.status === 'cancelled'
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className={`flex justify-between items-center ${
                                                                isCancelled ? 'opacity-50 text-ink-soft' : 'text-ink'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-2">
                                                                <span className={isCancelled ? 'line-through truncate' : 'truncate'}>
                                                                    {item.quantity}x {item.food?.name || 'Món ăn'}
                                                                </span>
                                                                {isCancelled && (
                                                                    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.2 text-[10px] font-semibold text-red-600">
                                                                        Đã hủy
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className={`font-semibold shrink-0 ${isCancelled ? 'line-through text-muted' : ''}`}>
                                                                {formatVnd(Number(item.price) * item.quantity)}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </>
                                )
                            })()}
                        </div>
                    )}
                </div>
            )}

            {activeOrder && (
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">Gọi thêm món</p>
            )}

            {cart.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-ink-soft">
                    <ShoppingCart size={28} className="opacity-40" />
                    <p className="text-sm">Chưa có món ăn nào.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {cart.map((item) => (
                        <div
                            key={item.foodId}
                            className="flex items-center justify-between gap-3 border-b border-jade-700/10 pb-3"
                        >
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-jade-700/10 text-ink-soft">
                                    <ImageOff size={16} className="opacity-50" />
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                                <p className="text-xs text-ink-soft">{formatVnd(item.price)}</p>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-ivory-deep px-2 py-1">
                                <button
                                    type="button"
                                    onClick={() => updateQty(item.foodId, -1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft hover:bg-jade-50"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="w-5 text-center text-xs font-semibold text-ink">{item.quantity}</span>
                                <button
                                    type="button"
                                    onClick={() => updateQty(item.foodId, 1)}
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-ink-soft hover:bg-jade-50"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeItem(item.foodId)}
                                className="text-ink-soft hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    <textarea
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        placeholder="Ghi chú"
                        rows={2}
                        className="w-full rounded-lg border border-jade-700/15 bg-ivory-deep px-3 py-2 text-sm text-ink outline-none focus:border-gold"
                    />

                    {submitError && <p className="text-xs text-red-500">{submitError}</p>}

                    <div className="flex items-center justify-between pt-1 text-sm font-semibold text-ink">
                        <span>Tổng cộng</span>
                        <span>{formatVnd(cartTotal)}</span>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmitOrder}
                        disabled={submitting}
                        className="w-full rounded-full bg-jade-700 py-3 text-sm font-semibold text-ivory hover:bg-jade-800 disabled:opacity-50 transition-colors shadow-md"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader2 size={16} className="animate-spin" /> Đang gửi...
                            </span>
                        ) : (
                            'Gọi món'
                        )}
                    </button>
                </div>
            )}

            {/* Yêu cầu thanh toán — luôn ở dưới cùng, dưới nút "Gọi món" */}
            {paymentSection}
        </>
    )

    return (
        <div className="min-h-screen bg-ivory pb-28 lg:pb-10">
            {/* Thanh tiện ích: bàn / thông báo / ngôn ngữ */}
            <div className="sticky top-0 z-30 border-b border-jade-700/10 bg-ivory/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 lg:px-10">
                    <Link to="#" className="flex items-center gap-2.5">
                        <img
                            src="https://6d39pwi252.ucarecd.net/ffdbd900-1103-4034-bb75-140e28891dfe/Gemini_Generated_Image_jlcrvpjlcrvpjlcrremovebgpreview.png"
                            alt="Logo Dola Restaurant"
                            className="h-10 w-10 rounded-full object-cover"
                        />
                        <span className="hidden flex-col leading-none sm:flex">
                            <span className="font-display text-base font-semibold tracking-wide text-jade-700">Dola</span>
                            <span className="font-script text-xs italic tracking-widest text-gold-dark">Restaurant</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-full border border-jade-700/15 bg-ivory px-3 py-1.5 hover:bg-jade-50 transition-colors"
                    >
                        <Armchair size={16} className="text-jade-700" />
                        <span className="text-left leading-tight">
                            <span className="block text-xs font-semibold text-ink">Bàn {table.code}</span>
                            <span className="hidden text-[10px] text-ink-soft sm:block">
                                Tầng {table.floor} · {table.capacity} chỗ
                            </span>
                        </span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => showToast('Bạn chưa có thông báo mới')}
                            className="relative text-ink-soft hover:text-jade-700 transition-colors"
                            aria-label="Thông báo"
                        >
                            <Bell size={19} />
                            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500" />
                        </button>
                        <span className="hidden items-center gap-1 rounded-full border border-jade-700/15 px-2.5 py-1 text-xs text-ink-soft sm:flex">
                            🇻🇳 Tiếng Việt
                        </span>
                    </div>
                </div>
            </div>


            {/* Bộ lọc mobile — dính lại khi cuộn, ẩn từ lg trở lên vì đã có sidebar */}
            <div className="lg:hidden sticky top-[49px] z-20 border-b border-jade-700/10 bg-ivory/95 pb-3 pt-4 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm món ăn..."
                        className="w-full rounded-full border border-jade-700/15 bg-ivory-deep px-5 py-2.5 text-sm text-ink outline-none focus:border-gold shadow-sm"
                    />

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                        {allChips.map((c) => {
                            const Icon = getCategoryIcon(c.slug)
                            return (
                                <button
                                    key={c.slug}
                                    onClick={() => setActiveCategory(c.slug)}
                                    className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${activeCategory === c.slug
                                        ? 'bg-jade-700 text-ivory'
                                        : 'bg-ivory-deep text-ink-soft hover:bg-jade-50'
                                        }`}
                                >
                                    <Icon size={14} /> {c.name}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Bố cục chính: sidebar danh mục — lưới món — giỏ hàng (desktop) */}
            <div className="mx-auto max-w-7xl px-4 pt-4 lg:px-10 lg:pt-6 flex items-start gap-6">
                {/* Sidebar danh mục — chỉ hiện từ lg trở lên */}
                <aside className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:gap-1 rounded-xl2 bg-ivory-deep p-3 shadow-card sticky top-[92px]">
                    {allChips.map((c) => {
                        const Icon = getCategoryIcon(c.slug)
                        const isActive = activeCategory === c.slug
                        return (
                            <button
                                key={c.slug}
                                onClick={() => setActiveCategory(c.slug)}
                                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${isActive ? 'bg-jade-700 text-ivory shadow-sm' : 'text-ink-soft hover:bg-jade-50'
                                    }`}
                            >
                                <Icon size={17} />
                                {c.name}
                            </button>
                        )
                    })}

                    <div className="mt-2 border-t border-jade-700/10 pt-3">
                        <button
                            type="button"
                            onClick={handleCallStaff}
                            className="flex w-full flex-col items-center gap-1 rounded-xl border border-gold/30 bg-saffron-light px-3 py-3 text-saffron-dark hover:bg-gold/10 transition-colors"
                        >
                            <Bell size={18} />
                            <span className="text-xs font-semibold">Gọi nhân viên</span>
                            <span className="text-[10px] opacity-70">Hỗ trợ nhanh chóng</span>
                        </button>
                    </div>
                </aside>

                {/* Lưới món */}
                <main className="min-w-0 flex-1">
                    <div className="mb-4 hidden items-center justify-between lg:flex">
                        <h2 className="font-display text-xl font-semibold text-jade-800">{activeCategoryName}</h2>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm món ăn..."
                            className="w-64 rounded-full border border-jade-700/15 bg-ivory-deep px-4 py-2 text-sm text-ink outline-none focus:border-gold"
                        />
                    </div>

                    {foodsLoading && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="overflow-hidden rounded-xl2 bg-ivory-deep shadow-card">
                                    <div className="h-36 w-full animate-pulse bg-jade-700/10" />
                                    <div className="space-y-2 p-4">
                                        <div className="h-3 w-3/4 animate-pulse rounded bg-jade-700/10" />
                                        <div className="h-3 w-1/3 animate-pulse rounded bg-jade-700/10" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!foodsLoading && foodsError && <p className="text-sm text-red-500">{foodsError}</p>}

                    {!foodsLoading && !foodsError && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3"
                        >
                            {filteredFoods.map((food) => (
                                <motion.div key={food.id} variants={fadeInUp}>
                                    <OrderFoodCard food={food} onAdd={addToCart} />
                                </motion.div>
                            ))}
                            {filteredFoods.length === 0 && (
                                <div className="col-span-full flex flex-col items-center gap-2 py-10 text-center text-ink-soft">
                                    <SearchX size={28} className="opacity-50" />
                                    <p className="text-sm">Không tìm thấy món phù hợp.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </main>

                {/* Giỏ hàng — panel cố định, đứng yên khi cuộn trang; nội dung tự cuộn bên trong nếu dài hơn màn hình */}
                <aside className="hidden lg:block lg:w-80 lg:shrink-0 sticky top-[92px] max-h-[calc(100vh-108px)] overflow-y-auto">
                    <div className="rounded-xl2 bg-paper p-5 shadow-card border border-jade-700/10">{cartPanel}</div>
                </aside>
            </div>

            {/* Toast phản hồi nhanh */}
            {toast && (
                <div className="fixed inset-x-0 bottom-24 lg:bottom-6 z-40 flex justify-center px-4">
                    <div className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-ivory shadow-lg">{toast}</div>
                </div>
            )}

            {/* Thanh giỏ hàng nổi — chỉ trên di động, panel desktop đã luôn hiển thị */}
            {(cartCount > 0 || activeOrder) && (
                <>
                    <style>{`
                        @keyframes cart-bar-bump {
                            0% { transform: scale(1); }
                            35% { transform: scale(1.05); }
                            100% { transform: scale(1); }
                        }
                        .cart-bar-bump { animation: cart-bar-bump 320ms ease-out; }
                    `}</style>
                    <div
                        className="lg:hidden fixed inset-x-4 z-30 flex justify-center"
                        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
                    >
                        <button
                            key={cartBumpKey}
                            type="button"
                            onClick={() => setCartOpen(true)}
                            className="cart-bar-bump flex w-full items-center justify-between rounded-full bg-jade-700 px-5 py-3.5 text-ivory shadow-card hover:bg-jade-800 transition-colors sm:max-w-lg"
                        >
                            {cartCount > 0 ? (
                                <>
                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                        <ShoppingCart size={18} /> {cartCount} món
                                    </span>
                                    <span className="text-sm font-semibold">{formatVnd(cartTotal)}</span>
                                </>
                            ) : (
                                <>
                                    <span className="flex items-center gap-2 text-sm font-semibold">
                                        <ShoppingCart size={18} /> Giỏ hàng của bạn
                                    </span>
                                    <span
                                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_LABELS[activeOrder.status]?.color || 'bg-ivory text-ink-soft'
                                            }`}
                                    >
                                        {STATUS_LABELS[activeOrder.status]?.label || activeOrder.status}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Bottom sheet giỏ hàng — chỉ trên di động */}
            {cartOpen && (
                <div
                    className={`lg:hidden fixed inset-0 z-40 flex items-end bg-black/40 backdrop-blur-xs transition-opacity duration-200 ${sheetVisible ? 'opacity-100' : 'opacity-0'
                        }`}
                    onClick={closeCart}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`mx-auto max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-ivory p-5 shadow-2xl transition-transform duration-200 ease-out sm:max-w-lg ${sheetVisible ? 'translate-y-0' : 'translate-y-full'
                            }`}
                        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
                    >
                        {cartPanel}
                    </div>
                </div>
            )}
        </div>
    )
}