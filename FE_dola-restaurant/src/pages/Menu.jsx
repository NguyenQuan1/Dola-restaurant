import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import SectionHeading from '../components/SectionHeading'
import FoodCard from '../components/FoodCard'
import foodService from '../api/foods'
import { fetchPublicCategories } from '../api/categories'
import { useLanguage } from '../context/LanguageContext'

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'price-asc', label: 'Giá: Thấp đến cao' },
  { value: 'price-desc', label: 'Giá: Cao đến thấp' },
  { value: 'rating-desc', label: 'Đánh giá cao nhất' },
]

// Cấu hình các animation variants chuẩn tương tự như trang News
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

export default function Menu() {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all') // GIỮ NGUYÊN — vẫn lưu theo slug
  const [sort, setSort] = useState('default')

  const sortOptions = [
    { value: 'default', label: t('menu.sortDefault') },
    { value: 'price-asc', label: t('menu.sortPriceAsc') },
    { value: 'price-desc', label: t('menu.sortPriceDesc') },
    { value: 'rating-desc', label: t('menu.sortRatingDesc') },
  ]

  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState(null)

  const [foods, setFoods] = useState([])
  const [foodsLoading, setFoodsLoading] = useState(true)
  const [foodsError, setFoodsError] = useState(null)

  useEffect(() => {
    let ignore = false

    const loadCategories = async () => {
      setCategoriesLoading(true)
      setCategoriesError(null)
      try {
        const list = await fetchPublicCategories()
        if (!ignore) setCategories(list)
      } catch (err) {
        if (!ignore) setCategoriesError(err?.response?.data?.message || 'Có lỗi khi tải danh mục')
      } finally {
        if (!ignore) setCategoriesLoading(false)
      }
    }

    loadCategories()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    const loadFoods = async () => {
      setFoodsLoading(true)
      setFoodsError(null)
      try {
        const list = await foodService.getAll({ limit: 200 })
        if (!ignore) setFoods(list)
      } catch (err) {
        if (!ignore) setFoodsError(err?.response?.data?.message || 'Có lỗi khi tải món ăn')
      } finally {
        if (!ignore) setFoodsLoading(false)
      }
    }

    loadFoods()
    return () => {
      ignore = true
    }
  }, [])

  const allChips = useMemo(() => [{ slug: 'all', name: t('menu.allCategories') }, ...categories], [categories, t])

  const measureRefs = useRef([])
  const [visibleCount, setVisibleCount] = useState(allChips.length)

  useLayoutEffect(() => {
    if (categoriesLoading || categoriesError) return

    const measure = () => {
      const nodes = measureRefs.current.filter(Boolean)
      if (nodes.length === 0) {
        setVisibleCount(allChips.length)
        return
      }
      const rowTops = []
      let cut = nodes.length
      for (let i = 0; i < nodes.length; i++) {
        const top = nodes[i].offsetTop
        if (!rowTops.includes(top)) rowTops.push(top)
        if (rowTops.length > 2) {
          cut = i
          break
        }
      }
      if (cut < nodes.length && cut > 0) cut -= 1
      setVisibleCount(Math.max(1, cut))
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [allChips, categoriesLoading, categoriesError])

  const visibleChips = allChips.slice(0, visibleCount)
  const hiddenChips = allChips.slice(visibleCount)

  const chipClasses = (slug) =>
    `rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors border ${
      activeCategory === slug
        ? 'bg-jade-700 text-ivory border-jade-700 shadow-sm'
        : 'bg-white text-ink-soft border-jade-700/15 hover:border-gold hover:bg-jade-50'
    }`

  const filtered = useMemo(() => {
    let list = foods.filter((f) =>
      f.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    if (activeCategory !== 'all') {
      const activeCategoryName = categories.find((c) => c.slug === activeCategory)?.name
      list = list.filter((f) => f.categoryName === activeCategoryName)
    }
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'rating-desc') list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [foods, categories, search, activeCategory, sort])

  return (
    <>
      {/* Banner chính với hiệu ứng trượt mượt xuất hiện khi load trang (Banner animation tương tự News) */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="bg-jade-700 py-16 text-center"
      >
        <motion.div variants={fadeInUp} className="mx-auto max-w-2xl px-6">
          <span className="font-script text-lg italic tracking-widest text-gold-light">{t('menu.eyebrow')}</span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ivory">{t('menu.title')}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ivory/75">
            {t('menu.subtitle')}
          </p>
        </motion.div>
      </motion.section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          {/* BỘ LỌC */}
          <div className="flex flex-col gap-6 rounded-xl2 bg-white border border-jade-700/10 p-6 shadow-card lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('menu.searchPlaceholder')}
                className="w-full rounded-full border border-jade-700/15 bg-white px-5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft">⌕</span>
            </div>

            <div className="relative min-w-0 flex-1">
              {categoriesLoading && (
                <span className="px-2 py-2 text-xs text-ink-soft">{t('menu.loadingCategories')}</span>
              )}

              {!categoriesLoading && categoriesError && (
                <span className="px-2 py-2 text-xs text-red-500">{categoriesError}</span>
              )}

              {!categoriesLoading && !categoriesError && (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none invisible absolute left-0 top-0 flex w-full flex-wrap gap-2"
                  >
                    {allChips.map((c, i) => (
                      <button
                        key={c.slug}
                        ref={(el) => (measureRefs.current[i] = el)}
                        className={chipClasses(c.slug)}
                        tabIndex={-1}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {visibleChips.map((c) => (
                      <button
                        key={c.slug}
                        onClick={() => setActiveCategory(c.slug)}
                        className={chipClasses(c.slug)}
                      >
                        {c.name}
                      </button>
                    ))}

                    {hiddenChips.length > 0 && (
                      <div className="group relative">
                        <button
                          type="button"
                          className="rounded-full border border-jade-700/15 bg-white px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:bg-jade-50"
                        >
                          +{hiddenChips.length}
                        </button>
                        <div className="invisible absolute left-0 top-full z-20 mt-2 flex w-48 flex-col gap-1 rounded-xl2 border border-jade-700/10 bg-white p-2 opacity-0 shadow-card transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
                          {hiddenChips.map((c) => (
                            <button
                              key={c.slug}
                              onClick={() => setActiveCategory(c.slug)}
                              className={`rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                activeCategory === c.slug
                                  ? 'bg-jade-700 text-ivory'
                                  : 'text-ink-soft hover:bg-jade-50'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-full border border-jade-700/15 bg-white px-5 py-2.5 text-sm text-ink-soft outline-none focus:border-gold lg:w-auto"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {t('menu.sortPrefix')} {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* KẾT QUẢ VỚI ANIMATION */}
          {foodsLoading && (
            <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="overflow-hidden rounded-xl2 bg-white border border-jade-700/10 shadow-card animate-pulse">
                  <div className="h-48 bg-jade-700/10" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 rounded bg-jade-700/10" />
                    <div className="h-4 w-24 rounded bg-jade-700/10" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!foodsLoading && foodsError && (
            <p className="mt-8 text-sm text-red-500">{foodsError}</p>
          )}

          {!foodsLoading && !foodsError && (
            <>
              <p className="mt-8 text-sm text-ink-soft">
                {t('menu.foundCount', { count: filtered.length })}
              </p>

              {filtered.length > 0 ? (
                /* Danh sách các thẻ món ăn sử dụng hiệu ứng Staggered + Hover Lift chuẩn như trang News */
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={staggerContainer}
                  className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filtered.map((food) => (
                    <motion.div
                      key={food.id}
                      variants={fadeInUp}
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="inline-block"
                    >
                      <FoodCard food={food} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="mt-16 text-center text-ink-soft">
                  {t('menu.notFound')}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}