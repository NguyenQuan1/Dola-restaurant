import { DollarSign, Star, CalendarCheck, UtensilsCrossed } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import StatCard from '../components/StatCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { revenueByDay, topFoods, reviews, reservations, foods } from '../data/mockData.js'

const currency = (n) => n.toLocaleString('vi-VN') + 'đ'

export default function Dashboard() {
  const totalReviews = reviews.length
  const todayReservations = reservations.filter((r) => r.date === '2026-07-27').length
  const totalRevenue = revenueByDay.reduce((s, d) => s + d.revenue, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Tổng doanh thu (7 ngày)" value={currency(totalRevenue)} delta="12,4%" icon={DollarSign} accent="saffron" />
        <StatCard label="Tổng đánh giá" value={totalReviews} delta="Mới" icon={Star} accent="teal" />
        <StatCard label="Đặt bàn hôm nay" value={todayReservations} delta="1 bàn" deltaPositive={false} icon={CalendarCheck} accent="clay" />
        <StatCard label="Món đang bán" value={foods.filter((f) => f.active).length} icon={UtensilsCrossed} accent="saffron" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-lg text-ink">Doanh thu theo ngày</h3>
            <span className="text-xs text-muted">7 ngày gần nhất</span>
          </div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9973F" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#C9973F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E6DECB" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#75847A', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#75847A', fontSize: 11 }} tickFormatter={(v) => `${v / 1000000}tr`} />
                <Tooltip
                  formatter={(v) => currency(v)}
                  contentStyle={{ border: '1px solid #E6DECB', borderRadius: 10, fontSize: 13 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C9973F" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <h3 className="font-display text-lg text-ink mb-1">Món phổ biến</h3>
          <p className="text-xs text-muted mb-3">Theo quan tâm của khách hàng</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFoods} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#23302A', fontSize: 11.5 }}
                />
                <Tooltip contentStyle={{ border: '1px solid #E6DECB', borderRadius: 10, fontSize: 13 }} />
                <Bar dataKey="sold" fill="#2F6B52" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <h3 className="font-display text-lg text-ink mb-3">Đánh giá gần đây</h3>
          <div className="space-y-2.5">
            {reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-ink font-medium">{r.customer} · {r.food}</p>
                  <p className="text-xs text-muted line-clamp-1">{r.comment}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-saffron">★ {r.rating}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <h3 className="font-display text-lg text-ink mb-3">Đặt bàn sắp tới</h3>
          <div className="space-y-2.5">
            {reservations.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-ink font-medium">{r.name} · {r.guests} khách</p>
                  <p className="text-xs text-muted">{r.date} lúc {r.time}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
