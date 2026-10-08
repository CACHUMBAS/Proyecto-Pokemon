import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PrismMark } from '../../components/ui/PrismMark'
export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <section className="not-found page-width section-space">
      <PrismMark />
      <p className="micro-label">404 / {t('notFound.label')}</p>
      <h1>{t('notFound.title')}</h1>
      <p>{t('notFound.description')}</p>
      <Link className="button button-primary" to="/">
        {t('common.back')} <span aria-hidden="true">↗</span>
      </Link>
    </section>
  )
}
