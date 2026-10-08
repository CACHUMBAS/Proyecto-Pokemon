import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './es.json'
import en from './en.json'

export type Locale = 'es' | 'en'
const storageKey = 'pokeprisma.locale.v1'

function savedLocale(): Locale {
  try {
    return localStorage.getItem(storageKey) === 'en' ? 'en' : 'es'
  } catch {
    return 'es'
  }
}

function syncDocument(language: string) {
  document.documentElement.lang = language === 'en' ? 'en' : 'es'
  document.title = i18n.t('meta.title')
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', i18n.t('meta.description'))
  try {
    localStorage.setItem(storageKey, document.documentElement.lang)
  } catch {
    // The language remains usable when browser storage is blocked.
  }
}

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: savedLocale(),
  fallbackLng: 'es',
  supportedLngs: ['es', 'en'],
  initAsync: false,
  interpolation: { escapeValue: false },
})
syncDocument(i18n.language)
i18n.on('languageChanged', syncDocument)

export default i18n
