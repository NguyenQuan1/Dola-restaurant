import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import AuthArt from '../components/AuthArt'

function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 4-5.8 7.5-5.8s6 1.8 7.5 5.8" />
    </svg>
  )
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function IconPhone(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 4.5h3.2l1.3 4-2 1.4a11.5 11.5 0 0 0 5.6 5.6l1.4-2 4 1.3V18a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3.5 6.1 1.5 1.5 0 0 1 5 4.5Z" />
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
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export default function Register() {
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }))

  const validate = () => {
    const err = {}
    if (!form.fullName.trim()) err.fullName = t('auth.errNameRequired')
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = t('auth.errInvalidEmail')
    if (!/^0\d{9}$/.test(form.phone.trim())) err.phone = t('auth.errInvalidPhone')
    if (form.password.length < 6) err.password = t('auth.errMinPassword')
    if (form.confirmPassword !== form.password) err.confirmPassword = t('auth.errMismatchPassword')
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors({})
    try {
      await register(form)
      navigate('/tai-khoan')
    } catch (err) {
      const message = err?.response?.data?.message || t('auth.errRegisterFailed')
      setErrors({ form: message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,_#fdf8ef_0%,_#f7efe2_100%)]">
      {/* Glow bập bùng */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="pointer-events-none absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-jade-700/10 blur-3xl"
      />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row-reverse">
        <AuthArt
          eyebrow={t('auth.registerArtEyebrow')}
          title={t('auth.registerArtTitle')}
          quote={t('auth.artQuote')}
          author={t('auth.artAuthor')}
          placement="right"
        />

        <div className="flex flex-1 items-center justify-center px-6 py-14 sm:px-10 lg:px-16 xl:px-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md rounded-[30px] border border-jade-700/10 bg-white/90 p-8 shadow-[0_25px_80px_rgba(11,57,49,0.22)] backdrop-blur-sm sm:p-10"
          >
            <motion.div variants={fadeInUp} className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-jade-700 font-display text-base text-gold-light">
                D
              </span>
              <span className="font-display text-lg font-semibold text-jade-700">Dola</span>
            </motion.div>

            <motion.span variants={fadeInUp} className="font-script block text-lg italic tracking-widest text-gold-dark">
              {t('auth.registerArtEyebrow')}
            </motion.span>
            <motion.h1 variants={fadeInUp} className="mt-2 font-display text-3xl font-semibold text-jade-700">
              {t('auth.registerTitle')}
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-3 text-sm leading-relaxed text-ink-soft">
              {t('auth.registerSubtitle')}
            </motion.p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <AnimatePresence>
                {errors.form && (
                  <motion.p
                    initial={{ opacity: 0, y: -8, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-lg bg-lacquer/10 px-4 py-2.5 text-sm text-lacquer"
                  >
                    {errors.form}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div variants={fadeInUp}>
                <label className="text-xs font-medium text-ink-soft">{t('auth.fullName')}</label>
                <div className="relative mt-1.5">
                  <IconUser className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-700/40" />
                  <input
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                    className="w-full rounded-lg border border-jade-700/15 bg-ivory-deep py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gold"
                    placeholder={t('auth.fullNamePlaceholder')}
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-xs text-lacquer">{errors.fullName}</p>}
              </motion.div>

              <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-ink-soft">{t('auth.emailOrPhone')}</label>
                  <div className="relative mt-1.5">
                    <IconMail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-700/40" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      className="w-full rounded-lg border border-jade-700/15 bg-ivory-deep py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gold"
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-lacquer">{errors.email}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">{t('auth.phone')}</label>
                  <div className="relative mt-1.5">
                    <IconPhone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-700/40" />
                    <input
                      value={form.phone}
                      onChange={handleChange('phone')}
                      className="w-full rounded-lg border border-jade-700/15 bg-ivory-deep py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gold"
                      placeholder={t('auth.phonePlaceholder')}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-lacquer">{errors.phone}</p>}
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-ink-soft">{t('auth.password')}</label>
                  <div className="relative mt-1.5">
                    <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-700/40" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange('password')}
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
                  {errors.password && <p className="mt-1 text-xs text-lacquer">{errors.password}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-ink-soft">{t('auth.confirmPassword')}</label>
                  <div className="relative mt-1.5">
                    <IconLock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-jade-700/40" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={handleChange('confirmPassword')}
                      className="w-full rounded-lg border border-jade-700/15 bg-ivory-deep py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-gold"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-jade-700/40 hover:text-jade-700"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="mt-1 text-xs text-lacquer">{errors.confirmPassword}</p>}
                </div>
              </motion.div>

              <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3 text-[15px] font-semibold text-jade-900 shadow-gold transition-all disabled:opacity-60"
                >
                  <span className="absolute left-0 top-0 h-full w-full -skew-x-12 -translate-x-full bg-white/30 transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                  <span className="relative z-10">{loading ? t('auth.registering') : t('auth.registerBtn')}</span>
                </button>
              </motion.div>

              <motion.p variants={fadeInUp} className="text-center text-sm text-ink-soft">
                {t('auth.haveAccount')}{' '}
                <Link to="/dang-nhap" className="font-semibold text-jade-700 hover:underline">
                  {t('auth.loginNow')}
                </Link>
              </motion.p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}