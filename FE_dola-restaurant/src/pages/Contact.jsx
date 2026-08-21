import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPublicContact } from '../api/contacts'
import { useLanguage } from '../context/LanguageContext'

// Cùng bộ variants với Home.jsx để chuyển động nhất quán trên toàn site
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.215, 0.61, 0.355, 1] } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

export default function Contact() {
  const { t } = useLanguage()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const contactInfo = [
    { label: t('contact.address'), value: t('contact.addressVal') },
    { label: t('contact.phone'), value: t('contact.phoneVal') },
    { label: t('contact.email'), value: t('contact.emailVal') },
    { label: t('contact.workingHours'), value: t('contact.workingHoursVal') },
  ]

  const handleChange = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) return

    setSending(true)
    setError('')
    try {
      await createPublicContact(form)
      setSent(true)
      setForm({ fullName: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      setError(
        err?.response?.data?.message || t('contact.sendError')
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="relative overflow-hidden bg-ivory py-16">
      {/* Glow bập bùng phía sau — cùng hiệu ứng với hero ở trang chủ */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -left-24 top-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.3, 0.12] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="pointer-events-none absolute right-0 bottom-0 h-[420px] w-[420px] rounded-full bg-jade-700/10 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center"
        >
          <span className="font-script text-lg italic tracking-widest text-gold-dark">
            {t('contact.eyebrow')}
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold text-jade-700">
            {t('contact.title')}
          </h1>
          <p className="mt-4 mx-auto max-w-xl text-[15px] leading-relaxed text-ink-soft">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* THÔNG TIN & BẢN ĐỒ — trượt vào từ bên trái */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={slideInLeft}
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              {contactInfo.map((c) => (
                <motion.div
                  key={c.label}
                  variants={fadeInUp}
                  whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
                  transition={{ duration: 0.25 }}
                  className="rounded-xl2 bg-ivory-deep p-5 shadow-card"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{c.label}</p>
                  <p className="mt-1.5 text-sm text-ink-soft">{c.value}</p>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-6 overflow-hidden rounded-xl2 border-[3px] border-gold/60 shadow-card">
              <iframe
                title="Bản đồ Dola Restaurant"
                src="https://maps.google.com/maps?q=Da%20Nang%2C%20Vietnam&t=&z=14&ie=UTF8&iwloc=&output=embed"
                className="h-[320px] w-full"
                loading="lazy"
              />
            </div>

            <div className="mt-6 flex gap-3">
              {['Facebook', 'Instagram'].map((s) => (
                <motion.a
                  key={s}
                  href="#"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 rounded-full border border-jade-700/20 px-5 py-2.5 text-sm font-medium text-jade-700 hover:bg-jade-50"
                >
                  {s}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* FORM LIÊN HỆ — trượt vào từ bên phải */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={slideInRight}
            className="rounded-xl2 bg-ivory-deep p-8 shadow-card"
          >
            <h2 className="font-display text-xl font-semibold text-jade-700">
              {t('contact.formTitle')}
            </h2>

            <AnimatePresence>
              {sent && (
                <motion.p
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden rounded-lg bg-jade-700/10 px-4 py-3 text-sm font-medium text-jade-700"
                >
                  {t('contact.sendSuccess')}
                </motion.p>
              )}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.form
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              <motion.div variants={fadeInUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder={t('contact.formName')}
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  className="rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
                <input
                  required
                  placeholder={t('contact.formPhone')}
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className="rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
                />
              </motion.div>
              <motion.input
                variants={fadeInUp}
                required
                type="email"
                placeholder={t('contact.formEmail')}
                value={form.email}
                onChange={handleChange('email')}
                className="w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
              />
              <motion.input
                variants={fadeInUp}
                placeholder={t('contact.formSubject')}
                value={form.subject}
                onChange={handleChange('subject')}
                className="w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
              />
              <motion.textarea
                variants={fadeInUp}
                required
                rows={5}
                placeholder={t('contact.formMessage')}
                value={form.message}
                onChange={handleChange('message')}
                className="w-full rounded-lg border border-jade-700/15 bg-ivory px-4 py-2.5 text-sm outline-none focus:border-gold"
              />
              <motion.div variants={fadeInUp} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <button
                  type="submit"
                  disabled={sending}
                  className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-gold-dark to-gold px-8 py-3.5 text-[15px] font-semibold text-jade-900 shadow-gold transition-all disabled:opacity-60"
                >
                  <span className="absolute left-0 top-0 h-full w-full -skew-x-12 -translate-x-full bg-white/30 transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                  <span className="relative z-10">{sending ? t('contact.sending') : t('contact.formSubmit')}</span>
                </button>
              </motion.div>
            </motion.form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}