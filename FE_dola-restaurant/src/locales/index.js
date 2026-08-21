import vi from './vi'
import en from './en'
import zh from './zh'
import ja from './ja'
import ko from './ko'

export const LANGUAGES = [
  {
    code: 'vi',
    name: 'Tiếng Việt',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    short: 'VI',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    short: 'EN',
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    short: 'ZH',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    short: 'JA',
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    short: 'KO',
  },
]

export const translations = {
  vi,
  en,
  zh,
  ja,
  ko,
}

export const DEFAULT_LANGUAGE = 'vi'
