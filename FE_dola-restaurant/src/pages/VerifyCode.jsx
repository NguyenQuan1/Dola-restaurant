import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { verifyCode } from '../api/auth'
import { useLanguage } from '../context/LanguageContext'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

function StepIndicator({ step, t }) {
  const steps = [t('auth.stepSendCode'), t('auth.stepVerify'), t('auth.stepReset')]
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

export default function VerifyCode() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!email.trim() || !code.trim()) {
      setError(t('auth.errFillFields'))
      return
    }

    setLoading(true)
    setError('')
    try {
      await verifyCode({ email, code })
      navigate('/dat-lai-mat-khau', { state: { email, code } })
    } catch (err) {
      const message = err?.response?.data?.message || t('common.error')
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
          <span className="font-script text-lg italic tracking-widest text-gold-dark">
            {t('auth.verifySubtitle')}
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-jade-700">
            {t('auth.verifyTitle')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {t('auth.verifyDesc')}
          </p>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <StepIndicator step={2} t={t} />
        </motion.div>

        <motion.div variants={fadeInUp} className="mt-8 rounded-xl2 bg-ivory-deep p-8 shadow-card">
          <form onSubmit={handleVerify} className="space-y-4">
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
              <label className="text-xs font-medium text-ink-soft">{t('auth.emailOrPhone')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                placeholder={t('auth.emailPlaceholder')}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-soft">{t('auth.verifyTitle')}</label>
              <motion.input
                animate={focused ? { scale: 1.01, borderColor: 'rgb(201 151 63)' } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-gold"
                placeholder={t('auth.codePlaceholder')}
                maxLength={6}
              />
            </div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3 text-[15px] font-semibold text-jade-900 shadow-gold transition-transform disabled:opacity-60"
              >
                {loading ? t('auth.verifying') : t('auth.verifyBtn')}
              </button>
            </motion.div>
            <p className="text-center text-sm text-ink-soft">
              <Link to="/dang-nhap" className="font-semibold text-jade-700 hover:underline">
                ← {t('auth.backToLogin')}
              </Link>
            </p>
          </form>
        </motion.div>
      </motion.div>
    </section>
  )
}