import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, animate, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import SectionHeading from '../components/SectionHeading'
import FeaturedCarousel from '../components/FeaturedCarousel'
import { promotions } from '../data/dishes'
import foodService from '../api/foods'
import { fetchReviewsByFoodId } from '../api/reviews'

// Danh sách ảnh xoay vòng cho khung ảnh chính
const HERO_MAIN_IMAGES = [
  'https://images.unsplash.com/photo-1622087250339-9295c9ef442b?q=80&w=1200&auto=format&fit=crop',
  'https://6d39pwi252.ucarecd.net/de13f8d2-2902-434c-a34a-a121731bc212/images',
  'https://6d39pwi252.ucarecd.net/62cfa642-931b-454a-b92b-666f2c73264b/images',
]

// Danh sách ảnh xoay vòng cho khung ảnh phụ lơ lửng
const HERO_SUB_IMAGES = [
  'https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=600&auto=format&fit=crop',
  'https://6d39pwi252.ucarecd.net/cfb49bc0-b2d9-47e9-bd17-de64d3bb1fe1/images',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600&auto=format&fit=crop',
]

const STATS = [
  { value: '12+', label: 'Năm kinh nghiệm' },
  { value: '48', label: 'Món ăn truyền thống' },
  { value: '4.9', label: 'Đánh giá trung bình' },
]

// 1. Hiệu ứng đếm số tăng dần
function AnimatedStat({ value, label }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    const numericValue = parseFloat(value)
    const suffix = value.replace(/[0-9.]/g, '')

    const controls = animate(0, numericValue, {
      duration: 2,
      ease: 'easeOut',
      onUpdate(val) {
        if (ref.current) {
          ref.current.textContent =
            (value.includes('.') ? val.toFixed(1) : Math.floor(val)) + suffix
        }
      },
    })
    return () => controls.stop()
  }, [isInView, value])

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }}>
      <p ref={ref} className="font-display text-2xl font-semibold text-jade-700">
        0
      </p>
      <p className="mt-1 text-xs leading-snug text-ink-soft">{label}</p>
    </motion.div>
  )
}

// 2. Hiệu ứng Khói bốc lên cho món ăn
function SteamEffect() {
  return (
    <div className="pointer-events-none absolute -top-12 left-1/2 flex -translate-x-1/2 gap-3 opacity-50 z-20">
      {[0, 0.5, 1].map((delay, index) => (
        <motion.div
          key={index}
          animate={{
            y: [0, -40, -70],
            opacity: [0, 0.8, 0],
            scaleX: [1, 1.6, 2],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            delay: delay,
            ease: 'easeInOut',
          }}
          className="h-16 w-2 rounded-full bg-white blur-md"
        />
      ))}
    </div>
  )
}

// 3. Hiệu ứng Chữ hiện từng từ
function WordByWordText({ text, className }) {
  const words = text.split(' ')
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 * i },
    }),
  }
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 12, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 20,
    },
  }

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {words.map((word, index) => (
        <motion.span variants={child} key={index} className="inline-block mr-2">
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

// 4. Nút cuộn về đầu trang — điều chỉnh vị trí cao hơn (bottom-16 sm:bottom-20)
function ScrollToTopButton({ visible }) {
  const scrollToTop = () => {
    animate(window.scrollY, 0, {
      duration: 1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => window.scrollTo(0, v),
    })
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          initial={{ opacity: 0, y: 60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          whileHover={{ scale: 1.08, boxShadow: '0px 12px 28px rgba(180, 140, 55, 0.35)' }}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-16 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-gold-dark to-gold text-jade-900 shadow-gold sm:bottom-20 sm:right-10"
        >
          <motion.svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <path d="M12 19V5" />
            <path d="M6 11l6-6 6 6" />
          </motion.svg>
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// Sequence variants animation
const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
}

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
}

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
}

export default function Home() {
  const [featuredDishes, setFeaturedDishes] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  // State quản lý index ảnh hiển thị
  const [currentMainImgIndex, setCurrentMainImgIndex] = useState(0)
  const [currentSubImgIndex, setCurrentSubImgIndex] = useState(0)

  // Tự động thay đổi ảnh mỗi 8 giây (8000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMainImgIndex((prev) => (prev + 1) % HERO_MAIN_IMAGES.length)
      setCurrentSubImgIndex((prev) => (prev + 1) % HERO_SUB_IMAGES.length)
    }, 8000)

    return () => clearInterval(timer)
  }, [])

  // Parallax Scroll
  const { scrollY, scrollYProgress } = useScroll()
  const bgGlowY = useTransform(scrollY, [0, 800], [0, 150])
  const floatingCardY = useTransform(scrollY, [0, 800], [0, -60])

  // Hiện nút cuộn về đầu trang sau khi cuộn xuống quá khỏi hero section
  const [showScrollTop, setShowScrollTop] = useState(false)
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowScrollTop(latest > 480)
  })

  useEffect(() => {
    let ignore = false
    setLoading(true)

    const fetchDishes = foodService
      .getAll({ isFeatured: true, limit: 6 })
      .then((list) => {
        if (!ignore) setFeaturedDishes(list)
      })
      .catch(() => {
        if (!ignore) setFeaturedDishes([])
      })

    const fetchReviews = fetchReviewsByFoodId()
      .then((list) => {
        if (!ignore && Array.isArray(list)) setReviews(list)
      })
      .catch(() => {
        if (!ignore) setReviews([])
      })

    Promise.all([fetchDishes, fetchReviews]).finally(() => {
      if (!ignore) setLoading(false)
    })

    return () => {
      ignore = true
    }
  }, [])

  const filteredReviews = useMemo(() => {
    return [...reviews]
      .filter((r) => r.isApproved !== false)
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
      .slice(0, 3)
  }, [reviews])

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light origin-left z-50 shadow-sm"
      />

      {/* ---------------- HERO SECTION ---------------- */}
      <section className="relative overflow-hidden bg-ivory">
        <motion.div
          style={{ y: bgGlowY }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -left-20 top-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="pointer-events-none absolute right-0 top-32 h-[450px] w-[450px] rounded-full bg-jade-700/10 blur-3xl"
        />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-10 lg:py-24"
        >
          {/* Cột trái */}
          <div>
            <motion.span
              variants={fadeInUp}
              className="font-script block text-2xl italic tracking-widest text-gold-dark"
            >
              Hương vị quê nhà
            </motion.span>

            <WordByWordText
              text="Món ăn Việt truyền thống,"
              className="font-display mt-4 text-3xl font-semibold leading-tight text-jade-700 sm:text-4xl lg:text-5xl"
            />
            <WordByWordText
              text="nấu bằng cả tấm lòng"
              className="font-display mt-4 text-3xl font-semibold leading-tight text-jade-700 sm:text-4xl lg:text-5xl"
            />

            <motion.p
              variants={fadeInUp}
              className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-soft"
            >
              Dola Restaurant mang đến những món ăn quen thuộc của ba miền — từ tô phở nghi ngút
              khói đến mâm cơm gia đình ấm áp, gìn giữ trọn vẹn hương vị truyền thống.
            </motion.p>

            <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: '0px 10px 25px rgba(180, 140, 55, 0.3)' }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/dat-ban"
                  className="group relative inline-block overflow-hidden rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3.5 text-[15px] font-semibold text-jade-900 shadow-gold transition-all duration-300"
                >
                  <span className="absolute left-0 top-0 h-full w-full -skew-x-12 -translate-x-full bg-white/30 transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                  <span className="relative z-10">Đặt bàn ngay</span>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/thuc-don"
                  className="inline-block rounded-full border border-jade-700/30 bg-ivory/80 px-8 py-3.5 text-[15px] font-semibold text-jade-700 backdrop-blur-sm transition-all hover:border-jade-700 hover:bg-jade-50"
                >
                  Xem thực đơn
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-jade-700/10 pt-6"
            >
              {STATS.map((s) => (
                <AnimatedStat key={s.label} value={s.value} label={s.label} />
              ))}
            </motion.div>
          </div>

          {/* Cột phải: Khung ảnh với hiệu ứng lật 3D */}
          <motion.div variants={fadeInUp} className="relative">
            <div className="relative mx-auto max-w-md">
              <SteamEffect />

              {/* Thẻ ảnh chính */}
              <motion.div
                whileHover={{
                  scale: 1.03,
                  rotateX: -5,
                  rotateY: 5,
                  boxShadow: '0px 20px 40px rgba(0,0,0,0.25)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative h-[420px] w-full overflow-hidden rounded-xl2 border-[3px] border-gold/70 bg-black shadow-2xl [perspective:1000px]"
              >
                <img
                  src={HERO_MAIN_IMAGES[currentMainImgIndex]}
                  alt="Nền mờ"
                  className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-70"
                />

                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentMainImgIndex}
                    src={HERO_MAIN_IMAGES[currentMainImgIndex]}
                    alt="Món ăn Dola Restaurant"
                    initial={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                    animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                    exit={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-108"
                  />
                </AnimatePresence>
              </motion.div>

              {/* Thẻ ảnh phụ */}
              <motion.div
                style={{ y: floatingCardY }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="shadow-card absolute -bottom-8 -left-8 hidden h-32 w-44 overflow-hidden rounded-xl2 border-[3px] border-ivory sm:block z-30 bg-black [perspective:1000px]"
              >
                <img
                  src={HERO_SUB_IMAGES[currentSubImgIndex]}
                  alt="Nền mờ phụ"
                  className="absolute inset-0 h-full w-full object-cover blur-md scale-110 opacity-70"
                />

                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentSubImgIndex}
                    src={HERO_SUB_IMAGES[currentSubImgIndex]}
                    alt="Món ăn đặc sắc"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: -90, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </AnimatePresence>
              </motion.div>

              {/* Badge 4.9 Sao */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                whileHover={{ scale: 1.1 }}
                className="shadow-card absolute -top-6 -right-4 flex cursor-default items-center gap-3 rounded-2xl border border-gold/40 bg-ivory/95 px-5 py-3 backdrop-blur-md sm:-right-8 z-30"
              >
                <span className="font-display animate-pulse text-xl text-gold-dark">★ 4.9</span>
                <span className="max-w-[7rem] text-[11px] font-medium leading-tight text-ink-soft">
                  từ hơn 1.200 khách hàng
                </span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ---------------- MÓN ĂN NỔI BẬT ---------------- */}
      <section className="relative bg-ivory-deep py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeInUp}
          >
            <SectionHeading
              eyebrow="Thực đơn tuyển chọn"
              title="Món ăn nổi bật"
              description="Những món được khách hàng yêu thích nhất, chế biến mỗi ngày từ nguyên liệu tươi và công thức gia truyền."
            />
          </motion.div>

          {loading && (
            <p className="mt-14 animate-pulse text-center text-sm text-ink-soft">
              Đang tải món ăn nổi bật...
            </p>
          )}

          {!loading && featuredDishes.length === 0 && (
            <p className="mt-14 text-center text-sm text-ink-soft">Chưa có món ăn nổi bật nào.</p>
          )}

          {!loading && featuredDishes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {/* Truyền các props cấu hình tự động trượt lần lượt từng món */}
              <FeaturedCarousel
                dishes={featuredDishes}
                autoPlay={true}
                interval={3500}
                slideBy="single"
              />
            </motion.div>
          )}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 text-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                to="/thuc-don"
                className="inline-flex items-center gap-2 rounded-full border border-jade-700/25 bg-ivory px-8 py-3 text-[15px] font-semibold text-jade-700 transition-all hover:border-jade-700 hover:bg-jade-50 hover:shadow-md"
              >
                <span>Xem toàn bộ thực đơn</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- KHUYẾN MÃI ---------------- */}
      <section className="relative overflow-hidden bg-jade-700 py-20">
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <SectionHeading eyebrow="Ưu đãi hôm nay" title="Khuyến mãi dành cho bạn" light />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {promotions.map((p) => (
              <motion.div
                key={p.title}
                variants={fadeInUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-xl2 border border-gold/30 bg-jade-600/40 p-7 shadow-lg backdrop-blur-sm transition-all hover:border-gold hover:bg-jade-600/70"
              >
                <span className="inline-block rounded-full border border-gold/40 bg-gold/20 px-3 py-1 text-xs font-semibold text-gold-light">
                  {p.tag}
                </span>
                <h3 className="font-display mt-4 text-xl font-semibold text-ivory">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/80">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ---------------- ĐÁNH GIÁ ---------------- */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <SectionHeading eyebrow="Khách hàng nói gì" title="Đánh giá từ thực khách" />
          </motion.div>

          {loading ? (
            <p className="mt-14 animate-pulse text-center text-sm text-ink-soft">Đang tải đánh giá...</p>
          ) : filteredReviews.length === 0 ? (
            <p className="mt-14 text-center text-sm text-ink-soft">Chưa có đánh giá nào từ thực khách.</p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={staggerContainer}
              className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3"
            >
              {filteredReviews.map((t, idx) => {
                const authorName = t.user?.fullName || 'Thực khách'
                const foodName = t.food?.name || 'Món ăn tại nhà hàng'
                const ratingStars = Math.min(5, Math.max(1, Number(t.rating) || 5))

                return (
                  <motion.div
                    key={t.id || idx}
                    variants={fadeInUp}
                    whileHover={{ y: -8, boxShadow: '0 15px 30px rgba(0,0,0,0.08)' }}
                    transition={{ duration: 0.3 }}
                    className="shadow-card rounded-xl2 border border-jade-700/10 bg-ivory-deep p-7 transition-all hover:border-gold/40"
                  >
                    <div className="text-base text-gold-dark">
                      {'★'.repeat(ratingStars)}
                      <span className="text-jade-100">{'★'.repeat(5 - ratingStars)}</span>
                    </div>

                    <p className="mt-4 text-[15px] italic leading-relaxed text-ink-soft">
                      "{t.comment}"
                    </p>

                    <div className="mt-5 flex items-center gap-3 border-t border-jade-700/10 pt-4">
                      <span className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-jade-700 text-sm font-semibold text-gold-light shadow-sm">
                        {authorName[0].toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-jade-700">{authorName}</p>
                        <p className="text-xs text-ink-soft">Đã đánh giá: {foodName}</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ---------------- ĐỊA CHỈ & BẢN ĐỒ ---------------- */}
      <section className="bg-ivory-deep py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideInLeft}
          >
            <div className="ornament justify-start">
              <span className="font-script text-lg italic tracking-widest text-gold-dark">
                Ghé thăm chúng tôi
              </span>
            </div>

            <h2 className="font-display mt-3 text-3xl font-semibold text-jade-700 sm:text-4xl">
              Địa chỉ &amp; giờ mở cửa
            </h2>

            <ul className="mt-6 space-y-4 text-[15px] text-ink-soft">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-gold-dark">◆</span>
                <span>123 Đường Trần Phú, Hải Châu, Đà Nẵng</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-gold-dark">◆</span>
                <span>Hotline: 0905 123 456</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-gold-dark">◆</span>
                <span>Mở cửa: 8:00 – 23:00 (tất cả các ngày trong tuần)</span>
              </li>
            </ul>

            <div className="mt-8">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-block">
                <Link
                  to="/lien-he"
                  className="inline-block rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3.5 text-[15px] font-semibold text-jade-900 shadow-gold transition-all"
                >
                  Chỉ đường cho tôi
                </Link>
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={slideInRight}
            className="overflow-hidden rounded-xl2 border-[3px] border-gold/60 shadow-xl"
          >
            <iframe
              title="Bản đồ Dola Restaurant"
              src="https://maps.google.com/maps?q=Da%20Nang%2C%20Vietnam&t=&z=14&ie=UTF8&iwloc=&output=embed"
              className="h-[360px] w-full"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* Nút cuộn về đầu trang */}
      <ScrollToTopButton visible={showScrollTop} />
    </>
  )
}