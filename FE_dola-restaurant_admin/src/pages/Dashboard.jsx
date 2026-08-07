import { useEffect, useState } from 'react'
import {
  CalendarCheck, Star, UtensilsCrossed, Users, MessageSquare, Clock, TrendingUp, AlertCircle,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from 'recharts'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { getDashboardStats } from '../api/dashboard.js'

const currency = (n) => Number(n).toLocaleString('vi-VN') + 'đ'

const RESERVATION_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  seated: 'Đã nhận bàn',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  no_show: 'Không đến',
}

const RESERVATION_STATUS_MAP = {
  pending: 'pending',
  confirmed: 'confirmed',
  seated: 'active',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'cancelled',
}

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-card p-5 animate-pulse">
      <div className="h-3 w-24 bg-black/8 rounded mb-4" />
      <div className="h-8 w-20 bg-black/8 rounded mb-2" />
      <div className="h-3 w-16 bg-black/8 rounded" />
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    getDashboardStats()
      .then((d) => { setData(d); setLoading(false) })
      .catch((e) => {
        setError(e?.response?.data?.message || 'Không thể tải dữ liệu Dashboard')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-surface rounded-xl border border-border shadow-card p-5 h-80 animate-pulse" />
          <div className="bg-surface rounded-xl border border-border shadow-card p-5 h-80 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-clay">
        <AlertCircle size={40} strokeWidth={1.5} />
        <p className="text-sm font-medium">{error}</p>
      </div>
    )
  }

  const { stats, reservationsByDay, recentReservations, recentReviews, topFoods } = data

  return (
    <div className="space-y-6">

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Đặt bàn hôm nay"
          value={stats.todayReservations}
          delta={stats.pendingReservations > 0 ? `${stats.pendingReservations} chờ xác nhận` : null}
          deltaPositive={false}
          icon={CalendarCheck}
          accent="clay"
        />
        <StatCard
          label="Tổng đánh giá"
          value={stats.totalReviews}
          delta={stats.pendingReviews > 0 ? `${stats.pendingReviews} chờ duyệt` : null}
          deltaPositive={false}
          icon={Star}
          accent="saffron"
        />
        <StatCard
          label="Món đang bán"
          value={stats.activeFood}
          icon={UtensilsCrossed}
          accent="teal"
        />
        <StatCard
          label="Khách hàng"
          value={stats.totalCustomers}
          delta={stats.pendingContacts > 0 ? `${stats.pendingContacts} liên hệ mới` : null}
          deltaPositive={false}
          icon={Users}
          accent="saffron"
        />
      </div>

      {/* ─── Charts ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Area Chart - Đặt bàn 7 ngày */}
        <div className="xl:col-span-2 bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display text-lg text-ink">Đặt bàn theo ngày</h3>
              <p className="text-xs text-muted mt-0.5">Số lượng đặt bàn 7 ngày gần nhất</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <TrendingUp size={14} />
              <span>7 ngày qua</span>
            </div>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reservationsByDay} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="resv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2F6B52" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2F6B52" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E6DECB" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#75847A', fontSize: 12 }} />
                <YAxis
                  tickLine={false} axisLine={false}
                  tick={{ fill: '#75847A', fontSize: 11 }}
                  allowDecimals={false}
                  tickFormatter={(v) => `${v} đơn`}
                  width={52}
                />
                <Tooltip
                  formatter={(v) => [`${v} đơn đặt bàn`, 'Số đặt bàn']}
                  contentStyle={{ border: '1px solid #E6DECB', borderRadius: 10, fontSize: 13 }}
                />
                <Area type="monotone" dataKey="count" stroke="#2F6B52" strokeWidth={2} fill="url(#resv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Top món ăn */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <h3 className="font-display text-lg text-ink mb-0.5">Top Món Ăn</h3>
          <p className="text-xs text-muted mb-3">Theo đánh giá trung bình của khách</p>
          {topFoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted">
              <UtensilsCrossed size={32} strokeWidth={1.5} />
              <p className="text-sm">Chưa có dữ liệu</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topFoods} layout="vertical" margin={{ left: 0, right: 24 }}>
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#23302A', fontSize: 11.5 }}
                  />
                  <Tooltip
                    formatter={(v) => [`★ ${Number(v).toFixed(1)}`, 'Rating TB']}
                    contentStyle={{ border: '1px solid #E6DECB', borderRadius: 10, fontSize: 13 }}
                  />
                  <Bar dataKey="avgRating" fill="#C9973F" radius={[0, 6, 6, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Data ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Đặt bàn sắp tới (pending + confirmed) */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-ink">Đặt bàn cần xử lý</h3>
            <span className="text-xs text-muted bg-black/5 rounded-full px-2.5 py-1">
              {recentReservations.length} đơn
            </span>
          </div>
          {recentReservations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
              <CalendarCheck size={28} strokeWidth={1.5} />
              <p className="text-sm">Không có đặt bàn nào đang chờ</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentReservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                  <div>
                    <p className="text-ink font-medium">{r.customerName} · {r.partySize} khách</p>
                    <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <Clock size={11} />
                      {r.reservationDate} lúc {r.reservationTime}
                    </p>
                  </div>
                  <StatusBadge status={RESERVATION_STATUS_MAP[r.status] || r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Đánh giá gần đây */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg text-ink">Đánh giá gần đây</h3>
            <span className="text-xs text-muted bg-black/5 rounded-full px-2.5 py-1">
              {recentReviews.length} đánh giá
            </span>
          </div>
          {recentReviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted">
              <MessageSquare size={28} strokeWidth={1.5} />
              <p className="text-sm">Chưa có đánh giá nào</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentReviews.map((r) => (
                <div key={r.id} className="flex items-start justify-between text-sm py-1.5 border-b border-border/60 last:border-0 gap-3">
                  <div className="min-w-0">
                    <p className="text-ink font-medium truncate">{r.userName} · <span className="text-muted font-normal">{r.foodName}</span></p>
                    <p className="text-xs text-muted line-clamp-1 mt-0.5">{r.comment || '(Không có bình luận)'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-bold text-saffron-dark">★ {r.rating}</span>
                    <StatusBadge status={r.isApproved ? 'approved' : 'pending'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
