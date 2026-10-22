import { useTranslation } from 'react-i18next'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { toCardPreview } from '../catalog/to-card-preview'
import { collectionArtwork, cardLabel } from './card-data'
export function CollectionCard({
  id,
  priority = false,
  onSelect,
}: {
  id: string
  priority?: boolean
  onSelect?: (id: string) => void
}) {
  const { i18n, t } = useTranslation(),
    locale = i18n.language === 'en' ? 'en' : 'es'
  const art = collectionArtwork.get(id)
  return (
    <div className="collection-card-art">
      {art ? (
        <PokemonCard card={toCardPreview(art, locale)} priority={priority} onSelect={onSelect} />
      ) : onSelect ? (
        <button
          type="button"
          className="collection-art-missing"
          onClick={() => onSelect(id)}
          aria-label={t('common.details', { name: cardLabel(id, locale) })}
        >
          {t('common.missing')}
        </button>
      ) : (
        <div className="collection-art-missing">{t('common.missing')}</div>
      )}
      <strong>{cardLabel(id, locale)}</strong>
      <span className="collection-card-id">
        {id}
        {art ? ' · ' + toCardPreview(art, locale).language.toUpperCase() : ''}
      </span>
    </div>
  )
}
