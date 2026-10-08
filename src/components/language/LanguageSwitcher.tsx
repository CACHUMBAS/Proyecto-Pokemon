import { useTranslation } from 'react-i18next'
import type { Locale } from '../../i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  return (
    <div className="language-switcher" role="group" aria-label={t('nav.language')}>
      {(['es', 'en'] as Locale[]).map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-label={locale === 'es' ? 'Español' : 'English'}
          aria-pressed={i18n.resolvedLanguage === locale}
          onClick={() => {
            void i18n.changeLanguage(locale)
          }}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
