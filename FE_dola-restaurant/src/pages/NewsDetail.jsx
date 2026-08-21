import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import newsService from '../api/news'
import PlaceholderPage from '../components/PlaceholderPage'
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
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
    transition: { staggerChildren: 0.12 }
  }
}

export default function NewsDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { t, language } = useLanguage()

  const [news, setNews] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setNotFound(false)

    const idOrSlug = slug
    newsService.getById(idOrSlug)
      .then((data) => {
        if (cancelled) return
        if (!data) { setNotFound(true); setLoading(false); return }
        setNews(data)

        newsService.getAll({ limit: 4 })
          .then(({ items }) => {
            if (!cancelled) setRelated(items.filter((n) => n.id !== data.id).slice(0, 3))
          })
          .catch(() => {})
          .finally(() => { if (!cancelled) setLoading(false) })
      })
      .catch(() => {
        if (!cancelled) { setNotFound(true); setLoading(false) }
      })

    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <section className="bg-ivory py-14">
        <div className="mx-auto max-w-4xl px-6 lg:px-10 animate-pulse space-y-6">
          <div className="h-3 w-48 rounded bg-jade-700/10" />
          <div className="h-8 rounded bg-jade-700/10" />
          <div className="h-64 rounded-xl2 bg-jade-700/10" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-4 rounded bg-jade-700/10" />)}
          </div>
        </div>
      </section>
    )
  }

  if (notFound || !news) {
    return <PlaceholderPage title={t('newsDetail.notFoundTitle')} description={t('newsDetail.notFoundDesc')} />
  }

  const paragraphs = typeof news.content === 'string'
    ? news.content.split('\n').filter(Boolean)
    : []

  return (
    <section className="bg-ivory py-14 overflow-hidden">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="mx-auto max-w-4xl px-6 lg:px-10"
      >
        {/* Điều hướng */}
        <motion.nav variants={fadeInUp} className="text-xs text-ink-soft">
          <Link to="/" className="hover:text-jade-700">{t('newsDetail.breadcrumbHome')}</Link> /{' '}
          <Link to="/tin-tuc" className="hover:text-jade-700">{t('newsDetail.breadcrumbNews')}</Link> /{' '}
          <span className="text-jade-700">{news.title}</span>
        </motion.nav>

        {/* Thẻ info */}
        <motion.div variants={fadeInUp} className="mt-6 flex items-center gap-3 text-xs">
          {news.category && (
            <span className="rounded-full bg-gold/15 px-3 py-1 font-semibold text-gold-dark">{news.category}</span>
          )}
          <span className="text-ink-soft">{formatDate(news.publishedAt, language)}</span>
        </motion.div>

        {/* Tiêu đề */}
        <motion.h1 variants={fadeInUp} className="mt-4 font-display text-3xl font-semibold leading-snug text-jade-700 sm:text-4xl">
          {news.title}
        </motion.h1>

        {/* Hình ảnh chính bài viết */}
        {news.image && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="mt-8 overflow-hidden rounded-xl2 shadow-card"
          >
            <img 
              src={news.image} 
              alt={news.title} 
              className="h-[360px] w-full object-cover transition-transform duration-1000 hover:scale-105" 
            />
          </motion.div>
        )}

        {/* Khối chữ nội dung */}
        <motion.div variants={fadeInUp} className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink-soft">
          {paragraphs.length > 0
            ? paragraphs.map((p, i) => <p key={i}>{p}</p>)
            : <p className="whitespace-pre-line">{news.content}</p>
          }
        </motion.div>

        {/* Hàng nút bấm */}
        <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap gap-4 border-t border-jade-700/10 pt-8">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link to="/dat-ban" className="inline-block rounded-full bg-jade-700 px-6 py-3 text-sm font-semibold text-ivory hover:bg-jade-600 shadow-sm transition-colors">
              {t('nav.bookTable')}
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link to="/tin-tuc" className="inline-block rounded-full border border-jade-700/25 px-6 py-3 text-sm font-semibold text-jade-700 hover:bg-jade-50 transition-colors">
              {t('newsDetail.backToNews')}
            </Link>
          </motion.div>
        </motion.div>

        {/* Bài viết liên quan */}
        {related.length > 0 && (
          <div className="mt-16">
            <motion.h2 variants={fadeInUp} className="font-display text-xl font-semibold text-jade-700">
              {t('newsDetail.relatedNews')}
            </motion.h2>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3"
            >
              {related.map((n) => (
                <motion.div
                  key={n.id}
                  variants={fadeInUp}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                >
                  <Link to={`/tin-tuc/${n.id}`} className="group block overflow-hidden rounded-xl2 bg-ivory-deep shadow-card h-full">
                    <div className="h-32 overflow-hidden bg-jade-700/10">
                      {n.image
                        ? <img src={n.image} alt={n.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        : <div className="flex h-full items-center justify-center text-jade-700/20 text-xs">{t('order.noImage')}</div>
                      }
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 text-sm font-semibold text-jade-700 group-hover:text-gold-dark transition-colors duration-200">{n.title}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </motion.div>
    </section>
  )
}