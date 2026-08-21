import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import CountryFlag from './CountryFlag'

export default function LanguageSwitcher({ className = '', variant = 'dropdown', onSelect }) {
  const { language, setLanguage, languages, currentLanguageObj } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (code) => {
    setLanguage(code)
    setIsOpen(false)
    if (onSelect) onSelect(code)
  }

  // Variant "list" for Mobile Drawer menu
  if (variant === 'list') {
    return (
      <div className={`grid grid-cols-2 gap-2 sm:grid-cols-3 ${className}`}>
        {languages.map((lang) => {
          const isActive = lang.code === language
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${isActive
                ? 'bg-jade-700 text-gold-light font-semibold shadow-sm ring-1 ring-gold/40'
                : 'border border-jade-700/15 bg-white text-ink-soft hover:border-gold hover:bg-jade-700/5 hover:text-jade-900'
                }`}
            >
              <CountryFlag code={lang.code} className="h-5 w-5 shrink-0" />
              <span className="truncate">{lang.nativeName}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // Default Luxury Dropdown variant (Desktop & Mobile header bar)
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group flex h-9 items-center gap-2 rounded-full border border-jade-700/20 bg-white px-3 py-1 text-xs font-semibold text-jade-900 shadow-sm transition-all duration-200 hover:border-gold hover:bg-white hover:shadow-gold/15"
        aria-label="Language selector"
        aria-expanded={isOpen}
      >
        <CountryFlag code={currentLanguageObj.code} className="h-4 w-4 shrink-0 shadow-xs" />
        <span className="tracking-wide text-jade-900 group-hover:text-gold-dark font-display text-[13px]">
          {currentLanguageObj.short}
        </span>
        <svg
          className={`h-3.5 w-3.5 text-jade-700 transition-transform duration-200 ${isOpen ? 'rotate-180 text-gold-dark' : ''
            }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-2xl border border-gold/30 bg-white p-1.5 shadow-[0_12px_32px_-4px_rgba(30,74,56,0.25)]"
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-jade-700/70 border-b border-jade-700/10 mb-1">
              Ngôn ngữ / Language
            </div>
            <div className="space-y-1">
              {languages.map((lang) => {
                const isActive = lang.code === language
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all ${isActive
                      ? 'bg-jade-700 text-gold-light font-semibold shadow-xs ring-1 ring-gold/30'
                      : 'text-ink-soft hover:bg-jade-700/10 hover:text-jade-900'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CountryFlag code={lang.code} className="h-5 w-5 shrink-0" />
                      <div className="flex flex-col text-left leading-tight">
                        <span className={isActive ? 'text-gold-light font-semibold' : 'text-jade-900 font-medium'}>
                          {lang.nativeName}
                        </span>
                        <span
                          className={`text-[10px] ${isActive ? 'text-gold-light/75' : 'text-ink-soft/60'
                            }`}
                        >
                          {lang.name}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <svg
                        className="h-4 w-4 text-gold-light shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
