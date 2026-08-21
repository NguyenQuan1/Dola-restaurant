import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import newsService from '../api/news'
import { useLanguage } from '../context/LanguageContext'

const formatDate = (d, lang = 'vi') => {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : lang === 'ko' ? 'ko-KR' : 'vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

// Cấu hình các animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] } 
  }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
}

export default function News() {
  const { t, language } = useLanguage()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    newsService.getAll({ limit: 50 })
      .then(({ items }) => { if (!cancelled) { setItems(items); setLoading(false) } })
      .catch(() => { if (!cancelled) { setError(t('news.error')); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  return (
    <>
      {/* Banner chính */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="bg-jade-700 py-16 text-center"
      >
        <motion.div variants={fadeInUp} className="mx-auto max-w-2xl px-6">
          <span className="font-script text-lg italic tracking-widest text-gold-light">
            {t('news.eyebrow')}
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">
            {t('news.title')}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ivory/75">
            {t('news.subtitle')}
          </p>
        </motion.div>
      </motion.section>

      {/* Danh sách bài viết */}
      <section className="bg-ivory py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {loading && (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl2 bg-ivory-deep shadow-card animate-pulse">
                  <div className="h-48 bg-jade-700/10" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 w-24 rounded bg-jade-700/10" />
                    <div className="h-5 rounded bg-jade-700/10" />
                    <div className="h-4 rounded bg-jade-700/10" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="text-center text-sm text-ink-soft">{t('news.empty')}</p>
          )}

          {!loading && !error && items.length > 0 && (
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((n) => (
                <motion.div
                  key={n.id}
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="inline-block"
                >
                  <Link
                    to={`/tin-tuc/${n.id}`}
                    className="group block overflow-hidden rounded-xl2 bg-ivory-deep shadow-card border border-transparent hover:border-gold/20 h-full transition-colors duration-300"
                  >
                    <div className="h-48 overflow-hidden bg-jade-700/10">
                      {n.image ? (
                        <img 
                          src={n.image} 
                          alt={n.title} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-jade-700/30 text-sm">
                          {t('order.noImage')}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs">
                        {n.category && (
                          <span className="rounded-full bg-gold/15 px-3 py-1 font-semibold text-gold-dark">{n.category}</span>
                        )}
                        <span className="text-ink-soft">{formatDate(n.publishedAt, language)}</span>
                      </div>
                      <h2 className="mt-3 font-display text-lg font-semibold leading-snug text-jade-700 group-hover:text-gold-dark transition-colors duration-200">
                        {n.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{n.excerpt}</p>
                      <span className="mt-4 inline-block text-sm font-semibold text-jade-700 underline decoration-gold decoration-2 underline-offset-4">
                        {t('news.readMore')} →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </>
  )
}