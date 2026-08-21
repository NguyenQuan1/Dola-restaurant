import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

export default function PlaceholderPage({ title, description }) {
  const { t } = useLanguage()

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 py-24 text-center">
      <span className="font-script text-lg italic tracking-widest text-gold-dark">
        {t('placeholder.comingSoon')}
      </span>
      <h1 className="mt-3 font-display text-3xl font-semibold text-jade-700 sm:text-4xl">
        {title || t('placeholder.pageNotFound')}
      </h1>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
        {description || t('placeholder.pageNotFoundDesc')}
      </p>
      <Link
        to="/"
        className="mt-8 rounded-full border border-jade-700/25 px-7 py-3 text-[15px] font-semibold text-jade-700 hover:bg-jade-50"
      >
        {t('common.backHome')}
      </Link>
    </section>
  )
}
