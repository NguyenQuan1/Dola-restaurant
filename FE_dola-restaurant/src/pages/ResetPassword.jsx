import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { resetPassword } from '../api/auth'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

function StepIndicator({ step }) {
  const steps = ['Gửi mã', 'Xác thực', 'Đổi mật khẩu']
  return (
    <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2">
      {steps.map((label, i) => {
        const index = i + 1
        const active = index === step
        const done = index < step
        return (
          <div key={label} className="flex items-center gap-2">
            <motion.span
              animate={active ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 1.6, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                done
                  ? 'bg-jade-700 text-ivory'
                  : active
                    ? 'bg-gold text-jade-900'
                    : 'bg-jade-700/10 text-ink-soft'
              }`}
            >
              {done ? '✓' : index}
            </motion.span>
            {index < steps.length && <span className="h-px w-6 bg-jade-700/15" />}
          </div>
        )
      })}
    </div>
  )
}

export default function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState(location.state?.code || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !code.trim()) {
      setError('Thiếu thông tin xác thực')
      return
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setLoading(true)
    setError('')
    try {
      await resetPassword({ email, code, newPassword })
      setDone(true)
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể đổi mật khẩu'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-ivory py-16">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 mx-auto w-full max-w-md px-6"
      >
        <motion.div variants={fadeInUp} className="text-center">
          <span className="font-script text-lg italic tracking-widest text-gold-dark">Đặt lại mật khẩu</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-jade-700">Tạo mật khẩu mới</h1>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <StepIndicator step={done ? 4 : 3} />
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-8 rounded-xl2 bg-ivory-deep p-8 shadow-card">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <motion.span
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-jade-700 text-xl text-gold-light"
                >
                  ✓
                </motion.span>
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  Mật khẩu của bạn đã được cập nhật thành công.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/dang-nhap')}
                  className="mt-6 rounded-full border border-jade-700/25 px-6 py-2.5 text-sm font-semibold text-jade-700 hover:bg-ivory"
                >
                  Về đăng nhập
                </motion.button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg bg-lacquer/10 px-4 py-2.5 text-sm text-lacquer"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Mã xác thực</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3 text-[15px] font-semibold text-jade-900 shadow-gold transition-transform disabled:opacity-60"
                  >
                    {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                  </button>
                </motion.div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  )
}