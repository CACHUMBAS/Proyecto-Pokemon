import { useTranslation } from 'react-i18next'
export function DesignPreviewPage() {
  const { t } = useTranslation()
  return <div className="page-width section-space"><h1>{t('preview.title')}</h1><p>{t('preview.description')}</p></div>
}
