import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import AuthArt from '../components/AuthArt'

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function IconLock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function IconEye(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6A10.6 10.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.9 13.9 0 0 1-3.2 3.9M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.3 0 2.5-.24 3.6-.66" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

export default function Login() {
  const { login, lockedMessage, clearLockedMessage } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password.trim()) {
      setError(t('auth.errFillFields'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate(location.state?.from || '/tai-khoan')
    } catch (err) {
      const message = err?.response?.data?.message || t('auth.errLoginFailed')
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-ivory">
      {/* Glow bập bùng phía sau */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-gold/15 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="pointer-events-none absolute right-0 bottom-0 h-[420px] w-[420px] rounded-full bg-jade-700/10 blur-3xl"
      />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <AuthArt
          eyebrow={t('auth.artEyebrow')}
          title={t('auth.artTitle')}
          quote={t('auth.artQuote')}
          author={t('auth.artAuthor')}
          placement="left"
        />

        <div className="flex flex-1 items-center justify-center px-6 py-14 sm:px-10 lg:px-16 xl:px-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full max-w-sm"
          >
            <motion.div variants={fadeInUp} className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-jade-700 font-display text-base text-gold-light">
                D
              </span>
              <span className="font-display text-lg font-semibold text-jade-700">Dola</span>
            </motion.div>

            <motion.span variants={fadeInUp} className="font-script block text-lg italic tracking-widest text-gold-dark">
              {t('auth.artEyebrow')}
            </motion.span>
            <motion.h1 variants={fadeInUp} className="mt-2 font-display text-3xl font-semibold text-jade-700">
              {t('auth.loginTitle')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-3 text-sm leading-relaxed text-ink-soft">
              {t('auth.loginSubtitle')}
            </motion.p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

              <motion.div variants={fadeInUp}>
                <label className="text-xs font-medium text-ink-soft">{t('auth.emailOrPhone')}</label>
                <div className="relative mt-1.5">
                  <IconMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-700/40" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
                    className="w-full rounded-lg border border-jade-700/15 bg-ivory-deep py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gold"
                    placeholder={t('auth.emailPlaceholder')}
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-ink-soft">{t('auth.password')}</label>
                  <Link to="/quen-mat-khau" className="text-xs font-medium text-gold-dark hover:underline">
                    {t('auth.forgotPasswordLink')}
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-700/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))}
                    className="w-full rounded-lg border border-jade-700/15 bg-ivory-deep py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-gold"
                    placeholder={t('auth.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-jade-700/40 hover:text-jade-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3 text-[15px] font-semibold text-jade-900 shadow-gold transition-all disabled:opacity-60"
                >
                  <span className="absolute left-0 top-0 h-full w-full -skew-x-12 -translate-x-full bg-white/30 transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                  <span className="relative z-10">{loading ? t('auth.loggingIn') : t('auth.loginBtn')}</span>
                </button>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-center text-sm text-ink-soft">
                {t('auth.noAccount')}{' '}
                <Link to="/dang-ky" className="font-semibold text-jade-700 hover:underline">
                  {t('auth.registerNow')}
                </Link>
              </motion.p>
            </form>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {lockedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className="w-full max-w-sm rounded-2xl bg-ivory p-7 text-center shadow-2xl"
            >
              <motion.span
                animate={{ rotate: [0, -8, 8, -8, 0] }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lacquer/10 text-2xl text-lacquer"
              >
                ⚠
              </motion.span>
              <h2 className="mt-4 font-display text-lg font-semibold text-jade-700">Tài khoản đã bị khoá</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{lockedMessage}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={clearLockedMessage}
                className="mt-6 w-full rounded-full bg-jade-700 px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-jade-600"
              >
                {t('common.confirm')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}