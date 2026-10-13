import { useTranslation } from 'react-i18next'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { toCardPreview } from '../catalog/to-card-preview'
import { artworkById } from './practice-data'

export function PracticeCard({ id, priority = false }: { id: string; priority?: boolean }) {
  const { i18n, t } = useTranslation()
  const preview = toCardPreview(artworkById.get(id)!, i18n.language === 'en' ? 'en' : 'es')
  return (
    <figure className="practice-art">
      <PokemonCard card={preview} priority={priority} />
      <figcaption>
        <a href={preview.sourceUrl} target="_blank" rel="noreferrer">
          {t('practice.artSource')} ↗
        </a>
        <span>
          {preview.language.toUpperCase()} · {id}
        </span>
      </figcaption>
    </figure>
  )
}
