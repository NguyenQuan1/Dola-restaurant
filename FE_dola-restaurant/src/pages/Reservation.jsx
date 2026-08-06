import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createPublicReservation } from '../api/reservations'

const STEPS = [
  { label: 'Khách', desc: 'Điền thông tin đặt bàn' },
  { label: 'Gửi yêu cầu', desc: 'Hệ thống tiếp nhận thông tin' },
  { label: 'Nhà hàng xác nhận', desc: 'Nhân viên liên hệ xác nhận' },
  { label: 'Đặt bàn thành công', desc: 'Giữ bàn theo thời gian yêu cầu' },
]

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, '9+']

const emptyForm = { fullName: '', phone: '', email: '', date: '', time: '', guests: 2, note: '' }

export default function Reservation() {
  const { user } = useAuth()
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  }))
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.fullName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
      }))
    }
  }, [user])

  const handleChange = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }))

  const validate = () => {
    const err = {}
    if (!form.fullName.trim()) err.fullName = 'Vui lòng nhập họ tên'
    if (!/^0\d{9}$/.test(form.phone.trim())) err.phone = 'Số điện thoại không hợp lệ (VD: 0905123456)'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Email không hợp lệ'
    if (!form.date) err.date = 'Vui lòng chọn ngày'
    if (!form.time) err.time = 'Vui lòng chọn giờ'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError('')

    try {
      const payload = {
        customerName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email?.trim() || undefined,
        partySize: form.guests === '9+' ? 9 : Number(form.guests),
        reservationDate: form.date,
        reservationTime: form.time,
        note: form.note?.trim() || undefined,
      }

      await createPublicReservation(payload)
      setSubmitted(true)
    } catch (err) {
      const msg = err.response?.data?.message
      if (Array.isArray(msg)) {
        setApiError(msg.join(', '))
      } else {
        setApiError(msg || 'Có lỗi xảy ra khi gửi yêu cầu đặt bàn. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm({ ...emptyForm, fullName: user?.fullName || '', email: user?.email || '', phone: user?.phone || '' })
    setErrors({})
    setApiError('')
    setSubmitted(false)
  }

  return (
    <section className="bg-ivory py-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="text-center">
          <span className="font-script text-lg italic tracking-widest text-gold-dark">Giữ chỗ trước cho bạn</span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-jade-700">Đặt bàn</h1>
          <p className="mt-4 mx-auto max-w-xl text-[15px] leading-relaxed text-ink-soft">
            Điền thông tin bên dưới, Dola Restaurant sẽ liên hệ xác nhận bàn trong vòng 15 phút.
          </p>
        </div>

        {/* QUY TRÌNH */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.label} className="relative flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-jade-700 font-display text-lg font-semibold text-gold-light">
                {i + 1}
              </div>
              <p className="mt-3 text-sm font-semibold text-jade-700">{s.label}</p>
              <p className="mt-1 text-xs leading-snug text-ink-soft">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <span className="absolute right-[-10%] top-6 hidden h-[2px] w-[20%] bg-gold/40 sm:block" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-xl2 bg-ivory-deep p-8 shadow-card sm:p-10">
          {submitted ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-jade-700 text-2xl text-gold-light">✓</span>
              <h2 className="mt-5 font-display text-2xl font-semibold text-jade-700">Gửi yêu cầu thành công!</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
                Cảm ơn <strong>{form.fullName}</strong> đã đặt bàn tại Dola Restaurant. Chúng tôi sẽ gửi gmail cho quý khách và gọi điện xác nhận
                qua số <strong>{form.phone}</strong> trong thời gian sớm nhất cho lịch hẹn ngày{' '}
                <strong>{form.date}</strong> lúc <strong>{form.time}</strong> ({form.guests} khách).
              </p>
              <button
                onClick={reset}
                className="mt-8 rounded-full border border-jade-700/25 px-7 py-3 text-[15px] font-semibold text-jade-700 hover:bg-ivory"
              >
                Đặt bàn khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {apiError && (
                <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {apiError}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-ink-soft">Họ và tên *</label>
                <input
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName && <p className="mt-1 text-xs text-lacquer">{errors.fullName}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-ink-soft">Số điện thoại *</label>
                <input
                  value={form.phone}
                  onChange={handleChange('phone')}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                  placeholder="0905123456"
                />
                {errors.phone && <p className="mt-1 text-xs text-lacquer">{errors.phone}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-ink-soft">Email</label>
                <input
                  value={form.email}
                  onChange={handleChange('email')}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                  placeholder="ban@email.com"
                />
                {errors.email && <p className="mt-1 text-xs text-lacquer">{errors.email}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-ink-soft">Số người</label>
                <select
                  value={form.guests}
                  onChange={handleChange('guests')}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                >
                  {GUEST_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g} người</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-ink-soft">Ngày *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={handleChange('date')}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                />
                {errors.date && <p className="mt-1 text-xs text-lacquer">{errors.date}</p>}
              </div>

              <div>
                <label className="text-xs font-medium text-ink-soft">Giờ *</label>
                <input
                  type="time"
                  value={form.time}
                  onChange={handleChange('time')}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                />
                {errors.time && <p className="mt-1 text-xs text-lacquer">{errors.time}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-ink-soft">Ghi chú</label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={handleChange('note')}
                  disabled={loading}
                  className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold disabled:opacity-60"
                  placeholder="Yêu cầu bàn gần cửa sổ, ghế trẻ em..."
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3.5 text-[15px] font-semibold text-jade-900 shadow-gold transition-transform hover:-translate-y-0.5 sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu đặt bàn'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

