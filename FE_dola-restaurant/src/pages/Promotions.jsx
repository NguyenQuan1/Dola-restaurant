import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import promotionService from '../api/promotions'
import { useLanguage } from '../context/LanguageContext'

const formatDiscount = (promo) => {
  if (promo.discountType === 'fixed') {
    const value = Number(promo.discountValue)
    return value >= 1000 ? `${Math.round(value / 1000)}K` : `${value}đ`
  }
  return `${Number(promo.discountValue)}%`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

const formatTimeRange = (start, end) => {
  if (!start && !end) return ''
  const trim = (t) => t?.slice(0, 5)
  if (start && end) return `${trim(start)} - ${trim(end)}`
  return trim(start || end)
}

const daysUntil = (dateStr) => {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(dateStr)
  return Math.round((end - today) / 86400000)
}

// Cấu hình animation dùng chung
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const cardVariant = (fromLeft) => ({
  hidden: { opacity: 0, x: fromLeft ? -60 : 60, rotate: fromLeft ? -4 : 4, scale: 0.92 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
})

const stampVariant = {
  hidden: { opacity: 0, scale: 0.3, rotate: -25 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 6,
    transition: { type: 'spring', stiffness: 260, damping: 14, delay: 0.15 },
  },
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <motion.path
        d="M4 12.5L9.5 18L20 6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
    </svg>
  )
}

function PromoCard({ promo, index, copied, onCopy, t }) {
  const timeRange = formatTimeRange(promo.startTime, promo.endTime)
  const left = daysUntil(promo.endDate)
  const isSoon = left !== null && left >= 0 && left <= 3
  const isCopied = copied === promo.code
  const fromLeft = index % 2 === 0

  return (
    <motion.div
      variants={cardVariant(fromLeft)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.25 } }}
      className="group relative overflow-hidden rounded-2xl border border-gold/30 bg-ivory-deep shadow-card hover:border-gold/60 hover:shadow-xl"
    >
      {/* THÂN VÉ */}
      <div className="relative px-6 pb-5 pt-6">
        <span className="font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-dark">
          {promo.type}
        </span>
        <h3 className="mt-1.5 pr-20 font-display text-lg font-semibold leading-snug text-jade-700">
          {promo.title}
        </h3>
        {promo.description && (
          <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{promo.description}</p>
        )}

        {/* CON DẤU GIẢM GIÁ */}
        <motion.div
          variants={stampVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          whileHover={{ rotate: [6, -8, 12, 6], scale: 1.08, transition: { duration: 0.5 } }}
          className="absolute right-6 top-6 flex h-[4.4rem] w-[4.4rem] flex-col items-center justify-center rounded-full border-2 border-dashed border-gold-dark bg-ivory text-center shadow-md"
        >
          <span className="font-display text-lg font-bold leading-none text-jade-700">
            {formatDiscount(promo)}
          </span>
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-gold-dark">
            OFF
          </span>
        </motion.div>
      </div>

      {/* ĐƯỜNG XÉ VÉ */}
      <div className="relative border-t-2 border-dashed border-gold/50">
        <span className="absolute left-0 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ivory" />
        <span className="absolute right-0 top-0 h-6 w-6 -translate-y-1/2 translate-x-1/2 rounded-full bg-ivory" />
      </div>

      {/* CUỐNG VÉ */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="text-xs text-gold-dark">
          <p>{t('promotions.validUntil')}: {formatDate(promo.endDate)}</p>
          {timeRange && <p className="mt-0.5">{t('promotions.applicableHours')}: {timeRange}</p>}
          {isSoon && (
            <motion.p
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="mt-1 font-semibold text-red-500"
            >
              {left === 0 ? t('promotions.endsToday') : t('promotions.daysLeft', { days: left })}
            </motion.p>
          )}
        </div>

        {promo.code && (
          <motion.button
            onClick={() => onCopy(promo.code)}
            whileTap={{ scale: 0.9 }}
            whileHover={!isCopied ? { y: -2, backgroundColor: 'rgba(197,160,89,0.12)' } : {}}
            className={`flex min-w-[6.5rem] shrink-0 items-center justify-center gap-1.5 rounded-full border-2 px-5 py-2 font-display text-sm font-semibold transition-colors duration-300 ${
              isCopied ? 'border-jade-700 bg-jade-700 text-ivory' : 'border-dashed border-gold text-gold-dark'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isCopied ? (
                <motion.span
                  key="copied"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-1.5"
                >
                  <CheckIcon />
                  {t('promotions.copied')}
                </motion.span>
              ) : (
                <motion.span
                  key="code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {promo.code}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

function SkeletonCard() {
  const pulse = { opacity: [0.4, 0.85, 0.4] }
  const transition = { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
  return (
    <div className="overflow-hidden rounded-2xl border border-gold/20 bg-ivory-deep shadow-card">
      <div className="space-y-3 px-6 pb-5 pt-6">
        <motion.div animate={pulse} transition={transition} className="h-3 w-20 rounded-full bg-black/10" />
        <motion.div animate={pulse} transition={{ ...transition, delay: 0.1 }} className="h-5 w-3/4 rounded-full bg-black/10" />
        <motion.div animate={pulse} transition={{ ...transition, delay: 0.2 }} className="h-3 w-full rounded-full bg-black/10" />
        <motion.div animate={pulse} transition={{ ...transition, delay: 0.3 }} className="h-3 w-5/6 rounded-full bg-black/10" />
      </div>
      <div className="border-t-2 border-dashed border-gold/30" />
      <div className="flex items-center justify-between px-6 py-4">
        <motion.div animate={pulse} transition={transition} className="h-3 w-24 rounded-full bg-black/10" />
        <motion.div animate={pulse} transition={{ ...transition, delay: 0.15 }} className="h-8 w-20 rounded-full bg-black/10" />
      </div>
    </div>
  )
}

export default function Promotions() {
  const { t } = useLanguage()
  const [promotions, setPromotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeType, setActiveType] = useState('all')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await promotionService.getPublic({ limit: 200 })
        if (!ignore) setPromotions(res.items ?? res)
      } catch (err) {
        if (!ignore) setError(err?.response?.data?.message || t('common.error'))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  const types = useMemo(() => {
    const seen = new Set()
    const list = []
    for (const p of promotions) {
      if (!seen.has(p.type)) {
        seen.add(p.type)
        list.push(p.type)
      }
    }
    return list
  }, [promotions])

  const filtered = useMemo(() => {
    if (activeType === 'all') return promotions
    return promotions.filter((p) => p.type === activeType)
  }, [promotions, activeType])

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(''), 1500)
  }

  const filterOptions = [{ value: 'all', label: t('promotions.filterAll') }, ...types.map((tp) => ({ value: tp, label: tp }))]

  return (
    <>
      {/* HERO SECTION */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative overflow-hidden bg-jade-700 py-16 text-center"
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-gold-light/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-gold-light/10 blur-3xl" />

        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-gold-light"
            style={{ top: `${25 + i * 20}%`, left: `${15 + i * 30}%` }}
            animate={{ y: [-6, -26, -6], opacity: [0, 1, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, delay: i * 0.9, ease: 'easeInOut' }}
          />
        ))}

        <motion.div variants={fadeInUp} className="relative mx-auto max-w-2xl px-6">
          <span className="font-script text-lg italic tracking-widest text-gold-light">
            {t('promotions.eyebrow')}
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">
            {t('promotions.title')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ivory/75">
            {t('promotions.subtitle')}
          </p>
        </motion.div>
      </motion.section>

      <section className="bg-ivory py-16">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          {/* BỘ LỌC THEO LOẠI */}
          {!loading && !error && types.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 flex flex-wrap justify-center gap-2"
            >
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActiveType(opt.value)}
                  className={`relative rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors duration-300 ${
                    activeType === opt.value ? 'text-ivory' : 'text-ink-soft hover:text-jade-700'
                  }`}
                >
                  {activeType === opt.value && (
                    <motion.span
                      layoutId="activeTypePill"
                      className="absolute inset-0 rounded-full bg-jade-700 shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              ))}
            </motion.div>
          )}

          {loading && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {!loading && error && <p className="text-center text-sm text-red-500">{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl2 bg-ivory-deep py-16 text-center text-ink-soft"
            >
              {t('promotions.noPromos')}
            </motion.div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {filtered.map((promo, i) => (
                <PromoCard key={promo.id} promo={promo} index={i} copied={copied} onCopy={handleCopy} t={t} />
              ))}
            </div>
          )}

          {/* CTA CUỐI TRANG */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-16 rounded-xl2 bg-jade-700 p-10 text-center text-ivory"
          >
            <h3 className="font-display text-2xl font-semibold">{t('home.hero.titlePart1')}</h3>
            <p className="mt-2 text-ivory/75">
              {t('promotions.subtitle')}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="inline-block">
                <Link
                  to="/dat-ban"
                  className="inline-flex rounded-full bg-gradient-to-r from-gold-dark to-gold px-7 py-3 text-sm font-semibold text-jade-900 shadow-gold transition-shadow duration-300 hover:shadow-lg"
                >
                  {t('nav.bookTable')}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}