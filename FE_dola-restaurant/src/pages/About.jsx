import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHeading from '../components/SectionHeading'
import { useLanguage } from '../context/LanguageContext'

const CHEF_IMAGES = [
  'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=600&auto=format&fit=crop',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTD_xyE0rUc9KlQQEjmHA4_-cAQ3hFJhBuXF_4f0YbzpA&s=10',
  'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?q=80&w=600&auto=format&fit=crop',
]

const SPACE_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1592861956120-e524fc739696?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=800&auto=format&fit=crop',
]

// Định nghĩa các cấu hình animation tái sử dụng (Variants)
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
      staggerChildren: 0.15
    }
  }
}

export default function About() {
  const { t } = useLanguage()

  const timeline = t('about.timeline') || []
  const chefs = t('about.chefs') || []
  const missions = t('about.missions') || []

  return (
    <>
      {/* HERO SECTION - Hiệu ứng xuất hiện mượt mà khi load trang */}
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative overflow-hidden bg-jade-700 py-20 text-center"
      >
        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-gold-light/10 blur-3xl" />
        <motion.div variants={fadeInUp} className="relative mx-auto max-w-3xl px-6">
          <span className="font-script text-lg italic tracking-widest text-gold-light">
            {t('about.eyebrow')}
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ivory sm:text-5xl">
            {t('about.title')}
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ivory/75">
            {t('about.subtitle')}
          </p>
        </motion.div>
      </motion.section>

      {/* LỊCH SỬ SECTION - Hiệu ứng trượt nhẹ khi cuộn tới màn hình */}
      <section className="bg-ivory py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="ornament justify-start">
                <span className="font-script text-lg italic tracking-widest text-gold-dark">
                  {t('about.historyEyebrow')}
                </span>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="mt-3 font-display text-3xl font-semibold text-jade-700 sm:text-4xl">
                {t('about.historyTitle')}
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                {t('about.historyDesc')}
              </motion.p>
              
              {/* Cột mốc Timeline xuất hiện tuần tự */}
              <motion.ol variants={staggerContainer} className="mt-8 space-y-6 border-l-2 border-gold/40 pl-6">
                {Array.isArray(timeline) && timeline.map((item) => (
                  <motion.li key={item.year} variants={fadeInUp} className="relative">
                    <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-gold" />
                    <p className="font-display text-lg font-semibold text-jade-700">{item.year}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.text}</p>
                  </motion.li>
                ))}
              </motion.ol>
            </motion.div>

            {/* Hình ảnh xuất hiện kèm hiệu ứng phóng to nhẹ */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 30 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mx-auto max-w-md"
            >
              <div className="overflow-hidden rounded-xl2 border-[3px] border-gold/70 shadow-card">
                <img
                  src="https://images.unsplash.com/photo-1555126634-323283e090fa?q=80&w=1000&auto=format&fit=crop"
                  alt="Không gian Dola Restaurant"
                  className="h-[420px] w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute -bottom-8 -left-8 hidden w-40 overflow-hidden rounded-xl2 border-[3px] border-ivory shadow-card sm:block"
              >
                <img
                  src="https://images.unsplash.com/photo-1600891964092-4316c288032e?q=80&w=600&auto=format&fit=crop"
                  alt="Bếp trưởng Dola"
                  className="h-32 w-full object-cover"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* KHÔNG GIAN SECTION - Bố cục ảnh nổi lên cùng hiệu ứng Hover phóng to */}
      <section className="bg-ivory-deep py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionHeading
            eyebrow={t('about.spaceEyebrow')}
            title={t('about.spaceTitle')}
            description={t('about.spaceDesc')}
          />
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {SPACE_IMAGES.map((src, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                className="overflow-hidden rounded-xl2 shadow-card bg-black"
              >
                <img 
                  src={src} 
                  alt={`Dola ${i + 1}`} 
                  className="h-56 w-full object-cover transition-all duration-700 hover:scale-110 hover:opacity-90" 
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ĐẦU BẾP SECTION - Card nhấc lên nhẹ khi di chuột vào (Hover interaction) */}
      <section className="bg-ivory py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionHeading eyebrow={t('about.chefsEyebrow')} title={t('about.chefsTitle')} />
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3"
          >
            {Array.isArray(chefs) && chefs.map((c, i) => (
              <motion.div 
                key={c.name || i} 
                variants={fadeInUp}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="overflow-hidden rounded-xl2 bg-ivory-deep shadow-card border border-transparent hover:border-gold/30"
              >
                <img src={CHEF_IMAGES[i % CHEF_IMAGES.length]} alt={c.name} className="h-64 w-full object-cover" />
                <div className="p-6 text-center">
                  <h3 className="font-display text-lg font-semibold text-jade-700">{c.name}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gold-dark">{c.role}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SỨ MỆNH SECTION - Card lật mượt và nút CTA thu hút tương tác */}
      <section className="bg-jade-700 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <SectionHeading eyebrow={t('about.missionEyebrow')} title={t('about.missionTitle')} light />
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {Array.isArray(missions) && missions.map((m, idx) => (
              <motion.div 
                key={m.title || idx} 
                variants={fadeInUp}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(5, 150, 105, 0.3)' }}
                className="rounded-xl2 border border-gold/25 bg-jade-600/40 p-7 text-center transition-colors duration-300"
              >
                <h3 className="font-display text-lg font-semibold text-ivory">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ivory/70">{m.desc}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Nút Đặt bàn phóng to/co lại nhẹ nhàng khi tương tác */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Link
                to="/dat-ban"
                className="inline-flex rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3.5 text-[15px] font-semibold text-jade-900 shadow-gold transition-shadow duration-300 hover:shadow-lg"
              >
                {t('about.ctaBook')}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}