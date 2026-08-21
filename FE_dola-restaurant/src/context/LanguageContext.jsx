import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { LANGUAGES, translations, DEFAULT_LANGUAGE } from '../locales'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'dola_restaurant_lang'

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && translations[saved]) {
        return saved
      }
    } catch (e) {
      console.warn('Cannot read localStorage', e)
    }
    return DEFAULT_LANGUAGE
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language)
      document.documentElement.lang = language
    } catch (e) {
      console.warn('Cannot write localStorage', e)
    }
  }, [language])

  const setLanguage = useCallback((code) => {
    if (translations[code]) {
      setLanguageState(code)
    }
  }, [])

  const currentLanguageObj = useMemo(() => {
    return LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]
  }, [language])

  // Translation function
  const t = useCallback(
    (keyPath, params = {}) => {
      if (!keyPath) return ''

      const getNested = (obj, path) => {
        return path.split('.').reduce((acc, part) => {
          if (acc && typeof acc === 'object') {
            return acc[part]
          }
          return undefined
        }, obj)
      }

      // Try current language
      let value = getNested(translations[language], keyPath)

      // Fallback to default language (vi)
      if (value === undefined && language !== DEFAULT_LANGUAGE) {
        value = getNested(translations[DEFAULT_LANGUAGE], keyPath)
      }

      // If still not found, return keyPath
      if (value === undefined) {
        return keyPath
      }

      // String interpolation if params provided
      if (typeof value === 'string' && Object.keys(params).length > 0) {
        let result = value
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(new RegExp(`{{\\s*${k}\\s*}}|{\\s*${k}\\s*}`, 'g'), String(v))
        }
        return result
      }

      return value
    },
    [language]
  )

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguageObj,
      languages: LANGUAGES,
      t,
    }),
    [language, setLanguage, currentLanguageObj, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
