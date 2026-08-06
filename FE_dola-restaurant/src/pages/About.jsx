import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import SectionHeading from '../components/SectionHeading'

const TIMELINE = [
  { year: '2014', text: 'Khởi đầu là một gánh phở nhỏ trên con phố cổ Hà Nội, phục vụ những tô phở gia truyền ba đời.' },
  { year: '2019', text: 'Mở rộng thành nhà hàng đầu tiên tại Đà Nẵng, mang theo trọn vẹn công thức truyền thống của gia đình.' },
  { year: '2023', text: 'Ra mắt thực đơn ba miền, quy tụ tinh hoa ẩm thực Bắc - Trung - Nam trong một không gian.' },
  { year: '2026', text: 'Dola Restaurant trở thành điểm đến quen thuộc của hơn 1.200 thực khách mỗi tháng.' },
]

const CHEFS = [
  {
    name: 'Đầu bếp Lê Văn Thành',
    role: 'Bếp trưởng điều hành',
    image: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?q=80&w=600&auto=format&fit=crop',
    desc: 'Hơn 20 năm kinh nghiệm với ẩm thực miền Bắc, người gìn giữ công thức nước dùng phở gia truyền.',
  },
  {
    name: 'Đầu bếp Trần Thị Mai',
    role: 'Bếp trưởng món Huế',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTD_xyE0rUc9KlQQEjmHA4_-cAQ3hFJhBuXF_4f0YbzpA&s=10',
    desc: 'Sinh ra tại Huế, mang đến hương vị cay nồng đặc trưng của ẩm thực cố đô.',
  },
  {
    name: 'Đầu bếp Phạm Quốc Bảo',
    role: 'Bếp trưởng món Nam',
    image: 'https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?q=80&w=600&auto=format&fit=crop',
    desc: 'Chuyên gia về các món cơm và bánh mì phong cách Sài Gòn phóng khoáng.',
  },
]

const MISSION = [
  { title: 'Nguyên liệu tươi mỗi ngày', desc: 'Lựa chọn kỹ càng từ các chợ đầu mối uy tín, chế biến trong ngày.' },
  { title: 'Công thức gia truyền', desc: 'Gìn giữ hương vị nguyên bản qua nhiều thế hệ đầu bếp.' },
  { title: 'Không gian ấm cúng', desc: 'Thiết kế mang hơi thở Đông Dương, gần gũi như bữa cơm gia đình.' },
  { title: 'Phục vụ tận tâm', desc: 'Đội ngũ nhân viên thân thiện, chu đáo trong từng chi tiết nhỏ.' },
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
          <span className="font-script text-lg italic tracking-widest text-gold-light">Câu chuyện của chúng tôi</span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ivory sm:text-5xl">
            Giới thiệu Dola Restaurant
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ivory/75">
            Hơn một thập kỷ gìn giữ hương vị quê nhà — từ gánh phở sớm mai đến mâm cơm sum vầy, Dola
            luôn trân trọng từng nguyên liệu và câu chuyện ẩn sau mỗi món ăn Việt.
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
                <span className="font-script text-lg italic tracking-widest text-gold-dark">Hành trình</span>
              </motion.div>
              <motion.h2 variants={fadeInUp} className="mt-3 font-display text-3xl font-semibold text-jade-700 sm:text-4xl">
                Lịch sử hình thành
              </motion.h2>
              <motion.p variants={fadeInUp} className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                Dola Restaurant được sáng lập bởi một gia đình có truyền thống nấu phở ba đời tại Hà Nội.
                Với mong muốn lan tỏa hương vị quê hương đến nhiều thực khách hơn, Dola đã không ngừng
                phát triển và mở rộng thực đơn của mình.
              </motion.p>
              
              {/* Cột mốc Timeline xuất hiện tuần tự */}
              <motion.ol variants={staggerContainer} className="mt-8 space-y-6 border-l-2 border-gold/40 pl-6">
                {TIMELINE.map((t) => (
                  <motion.li key={t.year} variants={fadeInUp} className="relative">
                    <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-gold" />
                    <p className="font-display text-lg font-semibold text-jade-700">{t.year}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{t.text}</p>
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
            eyebrow="Trải nghiệm"
            title="Không gian nhà hàng"
            description="Sự giao thoa giữa nét truyền thống Đông Dương và tiện nghi hiện đại, tạo nên một không gian ấm cúng cho mọi bữa ăn."
          />
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1592861956120-e524fc739696?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?q=80&w=800&auto=format&fit=crop',
            ].map((src, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                className="overflow-hidden rounded-xl2 shadow-card bg-black"
              >
                <img 
                  src={src} 
                  alt={`Không gian Dola ${i + 1}`} 
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
          <SectionHeading eyebrow="Những người tạo nên hương vị" title="Đội ngũ đầu bếp" />
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3"
          >
            {CHEFS.map((c) => (
              <motion.div 
                key={c.name} 
                variants={fadeInUp}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="overflow-hidden rounded-xl2 bg-ivory-deep shadow-card border border-transparent hover:border-gold/30"
              >
                <img src={c.image} alt={c.name} className="h-64 w-full object-cover" />
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
          <SectionHeading eyebrow="Điều chúng tôi theo đuổi" title="Sứ mệnh của Dola" light />
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MISSION.map((m) => (
              <motion.div 
                key={m.title} 
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
                Đặt bàn trải nghiệm ngay
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}