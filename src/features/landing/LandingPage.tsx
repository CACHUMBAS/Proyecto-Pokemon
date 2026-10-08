import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

export function LandingPage() {
  const { t } = useTranslation()
  return <div className="page-width section-space">
    <p>{t('common.development')}</p><h1>{t('hero.line1')} {t('hero.line2')} {t('hero.line3')}</h1>
    <p>{t('hero.description')}</p><Link to="/diseno">{t('hero.cta')}</Link>
    <section id="universo"><h2>{t('universe.title')}</h2><p>{t('universe.intro')}</p></section>
  </div>
}
