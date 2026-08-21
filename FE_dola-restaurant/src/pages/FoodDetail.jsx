import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate as useRouterNavigate, useParams as useReactParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import FoodCard from '../components/FoodCard'
import foodService, { formatVND } from '../api/foods'
import { fetchReviewsByFoodId, createReview, replyReview } from '../api/reviews'
import { getReviews } from '../data/reviews'
import PlaceholderPage from '../components/PlaceholderPage'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { MessageSquare, ChevronDown, ChevronUp, Reply, Send, CornerDownRight } from 'lucide-react'

// Cấu hình các animation variants chuẩn từ NewsDetail
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

export default function FoodDetail() {
  const { id } = useReactParams()
  const navigate = useRouterNavigate()
  const { isAuthenticated, user } = useAuth()
  const { t, language } = useLanguage()

  const [food, setFood] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [activeImage, setActiveImage] = useState(0)
  const [reviews, setReviews] = useState([])
  
  // States cho form đánh giá mới
  const [newRating, setNewRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  // States cho ẩn/hiện reply và form trả lời (rep)
  const [expandedReplies, setExpandedReplies] = useState({})
  const [replyingToId, setReplyingToId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replyError, setReplyError] = useState('')

  const toggleReplies = (reviewId) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }))
  }

  const handleOpenReplyForm = (reviewId, mentionUser = '') => {
    if (replyingToId === reviewId && !mentionUser) {
      setReplyingToId(null)
      setReplyText('')
      setReplyError('')
      return
    }
    setReplyingToId(reviewId)
    setReplyError('')
    if (mentionUser) {
      setReplyText(`@${mentionUser} `)
    } else {
      setReplyText('')
    }
  }

  const submitReplyHandler = async (e, targetReview, reviewKey) => {
    e.preventDefault()
    if (!isAuthenticated) {
      setReplyError(t('foodDetail.loginToReply'))
      return
    }
    if (!replyText.trim()) {
      setReplyError(t('foodDetail.replyPlaceholder'))
      return
    }

    setSubmittingReply(true)
    setReplyError('')

    try {
      let newReply
      if (targetReview && targetReview.id) {
        newReply = await replyReview(targetReview.id, replyText.trim())
      } else {
        newReply = {
          id: Date.now(),
          replyText: replyText.trim(),
          createdAt: new Date().toISOString(),
          user: {
            fullName: user?.fullName || user?.email || 'User',
            role: user?.role || 'customer',
          },
        }
      }

      setReviews((prev) =>
        prev.map((r) => {
          const isMatch = (r.id && targetReview.id && r.id === targetReview.id) || r === targetReview
          if (isMatch) {
            return {
              ...r,
              replies: [...(r.replies || []), newReply],
            }
          }
          return r
        })
      )
      setExpandedReplies((prev) => ({ ...prev, [reviewKey]: true }))
      setReplyText('')
      setReplyingToId(null)
    } catch (err) {
      const msg = err.response?.data?.message || t('foodDetail.replyError')
      setReplyError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmittingReply(false)
    }
  }

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setNotFound(false)
    setActiveImage(0)
    setSubmitError('')
    setSubmitSuccess('')

    foodService.getById(id)
      .then(async (data) => {
        if (ignore) return
        if (!data) {
          setNotFound(true)
          return
        }
        setFood(data)

        try {
          const apiReviews = await fetchReviewsByFoodId(data.id)
          if (!ignore) {
            if (Array.isArray(apiReviews) && apiReviews.length > 0) {
              const approvedReviews = apiReviews.filter(r => r.isApproved !== false)
              setReviews(approvedReviews)
            } else {
              const fallbackReviews = getReviews(id)
              setReviews(fallbackReviews.filter(r => r.isApproved !== false))
            }
          }
        } catch {
          if (!ignore) {
            const fallbackReviews = getReviews(id)
            setReviews(fallbackReviews.filter(r => r.isApproved !== false))
          }
        }

        try {
          const list = await foodService.getAll({ limit: 8 })
          const sameCategory = list.filter((f) => f.category === data.category && f.id !== data.id)
          if (!ignore) setRelated(sameCategory.slice(0, 4))
        } catch {
          if (!ignore) setRelated([])
        }
      })
      .catch(() => {
        if (!ignore) setNotFound(true)
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [id])

  if (loading) {
    return (
      <section className="bg-ivory py-14">
        <div className="mx-auto max-w-7xl px-6 lg:px-10 animate-pulse space-y-6">
          <div className="h-3 w-48 rounded bg-jade-700/10" />
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="h-[400px] rounded-xl2 bg-jade-700/10" />
            <div className="space-y-4">
              <div className="h-4 w-24 rounded bg-jade-700/10" />
              <div className="h-8 rounded bg-jade-700/10" />
              <div className="h-6 w-32 rounded bg-jade-700/10" />
              <div className="h-24 rounded bg-jade-700/10" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (notFound || !food) {
    return <PlaceholderPage title={t('foodDetail.dishNotFound')} description={t('foodDetail.dishNotFoundDesc')} />
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : food.rating || 0

  const submitReviewHandler = async (e) => {
    e.preventDefault()
    if (!comment.trim()) {
      setSubmitError(t('foodDetail.commentPlaceholder'))
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      const createdReview = await createReview({
        foodId: food.id,
        rating: newRating,
        comment: comment.trim(),
      })

      setReviews((prev) => [createdReview, ...prev])
      setComment('')
      setNewRating(5)
      setSubmitSuccess(t('foodDetail.reviewSuccess'))
    } catch (err) {
      const msg = err.response?.data?.message || t('foodDetail.reviewError')
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-ivory py-14 overflow-hidden">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="mx-auto max-w-7xl px-6 lg:px-10"
      >
        {/* Thanh điều hướng Breadcrumb */}
        <motion.nav variants={fadeInUp} className="text-xs text-ink-soft">
          <RouterLink to="/" className="hover:text-jade-700">{t('foodDetail.breadcrumbHome')}</RouterLink> /{' '}
          <RouterLink to="/thuc-don" className="hover:text-jade-700">{t('foodDetail.breadcrumbMenu')}</RouterLink> /{' '}
          <span className="text-jade-700">{food.name}</span>
        </motion.nav>

        {/* Khối Thông tin Món ăn chính */}
        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* GALLERY MÓN ĂN */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
          >
            <div className="overflow-hidden rounded-xl2 border-[3px] border-gold/60 shadow-card">
              <img 
                src={food.images[activeImage]} 
                alt={food.name} 
                className="h-[400px] w-full object-cover transition-transform duration-700 hover:scale-105" 
              />
            </div>
            {food.images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {food.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                      activeImage === i ? 'border-gold scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`${food.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* CHI TIẾT THÔNG TIN MÓN */}
          <motion.div variants={fadeInUp} className="flex flex-col justify-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
              {food.categoryName || food.category}
            </span>
            <h1 className="mt-2 font-display text-3xl font-semibold text-jade-700 sm:text-4xl">{food.name}</h1>

            <div className="mt-3 flex items-center gap-3">
              {avgRating > 0 && (
                <>
                  <span className="text-gold-dark">
                    {'★'.repeat(Math.round(avgRating))}
                    <span className="text-jade-100">{'★'.repeat(5 - Math.round(avgRating))}</span>
                  </span>
                  <span className="text-sm text-ink-soft">
                    {avgRating} ({t('foodDetail.reviewsCount', { count: reviews.length })})
                  </span>
                </>
              )}
              <span
                className={`ml-auto rounded-full px-3 py-1 text-[11px] font-semibold ${
                  food.available ? 'bg-jade-700/10 text-jade-700' : 'bg-ink-soft/10 text-ink-soft'
                }`}
              >
                {food.available ? t('foodDetail.available') : t('foodDetail.soldOut')}
              </span>
            </div>

            <p className="mt-4 font-display text-2xl font-semibold text-lacquer">{formatVND(food.price)}</p>
            {food.desc && <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{food.desc}</p>}

            {food.ingredients && food.ingredients.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display text-base font-semibold text-jade-700">{t('foodDetail.ingredients')}</h3>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {food.ingredients.map((ing) => (
                    <li key={ing} className="flex items-center gap-2 text-sm text-ink-soft">
                      <span className="text-gold-dark">◆</span> {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/dat-ban')}
                className="rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3 text-[15px] font-semibold text-jade-900 shadow-gold transition-colors"
              >
                {t('foodDetail.bookTable')}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* ĐÁNH GIÁ & FORM ĐÁNH GIÁ */}
        <motion.div variants={fadeInUp} className="mt-20 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-semibold text-jade-700">
              {t('foodDetail.customerReviews', { count: reviews.length })}
            </h2>
            <div className="mt-6 space-y-6">
              {reviews.length === 0 && (
                <p className="text-sm text-ink-soft">{t('foodDetail.noReviews')}</p>
              )}
              {reviews.map((r, i) => {
                const reviewId = r.id || i
                const authorName = r.user?.fullName || r.name || t('home.reviews.authorDefault')
                const displayDate = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ko' ? 'ko-KR' : 'vi-VN')
                  : (r.date || '')
                const ratingStars = Math.min(5, Math.max(1, Number(r.rating) || 5))
                const replies = r.replies || []
                const isExpanded = !!expandedReplies[reviewId]
                const isReplying = replyingToId === reviewId

                return (
                  <div key={reviewId} className="rounded-xl2 bg-ivory-deep p-6 shadow-card transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-jade-700 font-display text-sm font-semibold text-gold-light">
                          {authorName ? authorName[0].toUpperCase() : 'K'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-jade-700">{authorName}</p>
                          <p className="text-xs text-ink-soft">{displayDate}</p>
                        </div>
                      </div>
                      <span className="text-gold-dark">
                        {'★'.repeat(ratingStars)}
                        <span className="text-jade-100">{'★'.repeat(5 - ratingStars)}</span>
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">{r.comment}</p>

                    {/* Thanh thao tác */}
                    <div className="mt-4 flex items-center gap-4 text-xs border-t border-jade-700/10 pt-3">
                      {replies.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleReplies(reviewId)}
                          className="inline-flex items-center gap-1.5 font-medium text-jade-700 hover:text-jade-800 transition-colors bg-jade-700/5 hover:bg-jade-700/10 px-3 py-1.5 rounded-full"
                        >
                          <MessageSquare size={13} className="text-gold-dark" />
                          <span>{t('foodDetail.viewReplies', { count: replies.length })}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenReplyForm(reviewId)}
                        className="inline-flex items-center gap-1.5 font-medium text-ink-soft hover:text-jade-700 transition-colors px-2 py-1"
                      >
                        <Reply size={13} />
                        <span>{t('foodDetail.reply')}</span>
                      </button>
                    </div>

                    {/* Phản hồi */}
                    {isExpanded && replies.length > 0 && (
                      <div className="mt-4 space-y-3 rounded-xl bg-jade-700/5 p-4 border-l-2 border-gold transition-all">
                        {replies.map((reply, idx) => {
                          const replyUser = reply.user
                          const replyAuthorName = replyUser?.fullName || reply.author || t('home.reviews.authorDefault')
                          const isAdmin = !!reply.isAdminReply
                          const replyDate = reply.createdAt
                            ? new Date(reply.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ko' ? 'ko-KR' : 'vi-VN')
                            : (reply.date || '')

                          return (
                            <div key={reply.id || idx} className="group text-xs border-b border-jade-700/5 pb-2.5 last:border-b-0 last:pb-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-jade-700/10 text-[11px] font-semibold text-jade-700">
                                    {replyAuthorName ? replyAuthorName[0].toUpperCase() : 'U'}
                                  </span>
                                  <span className="font-semibold text-jade-700">
                                    {replyAuthorName}
                                  </span>
                                  {isAdmin && (
                                    <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold-dark">
                                      Dola Restaurant
                                    </span>
                                  )}
                                  <span className="text-[10px] text-ink-soft">
                                    {replyDate}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReplyForm(reviewId, replyAuthorName)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-ink-soft hover:text-jade-700 flex items-center gap-0.5"
                                >
                                  <CornerDownRight size={12} />
                                  <span>{t('foodDetail.reply')}</span>
                                </button>
                              </div>
                              <p className="mt-1.5 pl-8 text-xs text-ink-soft leading-relaxed">
                                {reply.replyText || reply.comment}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Form nhập trả lời */}
                    {isReplying && (
                      <div className="mt-4 rounded-xl bg-ivory p-4 border border-jade-700/15 shadow-inner">
                        {!isAuthenticated ? (
                          <div className="flex items-center justify-between text-xs text-ink-soft">
                            <span>{t('foodDetail.loginToReply')}</span>
                            <button
                              type="button"
                              onClick={() => navigate('/dang-nhap')}
                              className="font-semibold text-jade-700 hover:underline"
                            >
                              {t('nav.login')}
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={(e) => submitReplyHandler(e, r, reviewId)} className="space-y-3">
                            {replyError && (
                              <p className="text-xs text-red-500 font-medium">{replyError}</p>
                            )}
                            <textarea
                              required
                              rows={2}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={t('foodDetail.replyPlaceholder')}
                              className="w-full rounded-lg border border-jade-700/15 bg-white p-3 text-xs outline-none focus:border-gold transition-colors"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingToId(null)
                                  setReplyText('')
                                  setReplyError('')
                                }}
                                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-jade-50 transition-colors"
                              >
                                {t('common.cancel')}
                              </button>
                              <button
                                type="submit"
                                disabled={submittingReply}
                                className="inline-flex items-center gap-1.5 rounded-full bg-jade-700 px-4 py-1.5 text-xs font-semibold text-ivory hover:bg-jade-600 disabled:opacity-50 transition-colors shadow-sm"
                              >
                                <Send size={12} />
                                {submittingReply ? t('foodDetail.submittingReply') : t('foodDetail.sendReply')}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* FORM ĐÁNH GIÁ */}
          <div>
            <h3 className="font-display text-lg font-semibold text-jade-700">
              {t('foodDetail.leaveReview')}
            </h3>

            {!isAuthenticated ? (
              <div className="mt-4 rounded-xl2 bg-ivory-deep p-6 text-center shadow-card border border-jade-700/10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold/20 text-gold-dark text-xl">
                  ★
                </div>
                <h4 className="mt-3 font-display text-base font-semibold text-jade-700">
                  {t('foodDetail.loginToReview')}
                </h4>
                <button
                  type="button"
                  onClick={() => navigate('/dang-nhap')}
                  className="mt-5 w-full rounded-full bg-jade-700 px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-jade-600 transition-colors shadow-sm"
                >
                  {t('foodDetail.loginNow')}
                </button>
              </div>
            ) : (
              <form onSubmit={submitReviewHandler} className="mt-4 space-y-4 rounded-xl2 bg-ivory-deep p-6 shadow-card">
                {submitSuccess && (
                  <div className="rounded-lg bg-jade-700/10 p-3 text-xs font-medium text-jade-700 border border-jade-700/20">
                    {submitSuccess}
                  </div>
                )}
                {submitError && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-xs font-medium text-red-600 border border-red-500/20">
                    {submitError}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-ink-soft">{t('foodDetail.fullName')}</label>
                    <span className="text-[10px] text-jade-700 font-semibold">{t('foodDetail.autoFromAccount')}</span>
                  </div>
                  <input
                    type="text"
                    disabled
                    value={user?.fullName || user?.email || 'User'}
                    className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory/70 px-3 py-2 text-sm font-semibold text-jade-800 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-soft">{t('foodDetail.ratingStar')}</label>
                  <div className="mt-1 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setNewRating(n)}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`text-2xl transition-transform hover:scale-110 ${
                          n <= (hoverRating || newRating) ? 'text-gold-dark' : 'text-jade-100'
                        }`}
                        title={`${n} ${t('foodDetail.starsUnit')}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="ml-2 text-xs font-medium text-ink-soft">
                      {hoverRating || newRating} / 5 {t('foodDetail.starsUnit')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-soft">{t('foodDetail.comment')}</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={t('foodDetail.commentPlaceholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-jade-700/15 bg-ivory px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-jade-700 px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-jade-600 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submitting ? t('foodDetail.submitting') : t('foodDetail.submitReview')}
                </button>
              </form>
            )}
          </div>
        </motion.div>

        {/* MÓN LIÊN QUAN */}
        {related.length > 0 && (
          <div className="mt-20">
            <motion.h2 variants={fadeInUp} className="font-display text-2xl font-semibold text-jade-700">
              {t('foodDetail.relatedDishes')}
            </motion.h2>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
            >
              {related.map((f) => (
                <motion.div
                  key={f.id}
                  variants={fadeInUp}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                >
                  <FoodCard food={f} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </motion.div>
    </section>
  )
}