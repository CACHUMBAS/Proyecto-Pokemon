import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CollectionCard as CardDefinition,
  CollectionCommand,
  CollectionSnapshot,
} from '../../collection/types'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { Button } from '../../components/ui/Button'
import { toCardPreview } from '../catalog/to-card-preview'
import { cardLabel, collectionArtwork, collectionSpecies } from './card-data'

export function CardInspector({
  item,
  definition,
  index,
  total,
  disabled,
  navigate,
  close,
  choose,
}: {
  item: CollectionSnapshot['inventory'][number]
  definition: CardDefinition
  index: number
  total: number
  disabled: boolean
  navigate: (direction: -1 | 1) => void
  close: () => void
  choose: (command: CollectionCommand) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'es'
  const ref = useRef<HTMLDialogElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const art = collectionArtwork.get(item.card_id)
  const preview = art ? toCardPreview(art, locale, 'high') : null
  const name = cardLabel(item.card_id, locale)
  const species = collectionSpecies.get(definition.species_id)
  useLayoutEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    closeRef.current?.focus()
    return () => dialog.close()
  }, [])
  function dismiss() {
    ref.current?.close()
    close()
  }
  return (
    <dialog
      ref={ref}
      className={'card-inspector tier-' + definition.budget}
      aria-labelledby="inspector-title"
      onCancel={(event) => {
        event.preventDefault()
        dismiss()
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' && index > 0) {
          event.preventDefault()
          navigate(-1)
        }
        if (event.key === 'ArrowRight' && index < total - 1) {
          event.preventDefault()
          navigate(1)
        }
      }}
    >
      <header className="inspector-header">
        <span className="eyebrow">{t('collection.album.viewer')}</span>
        <button
          type="button"
          ref={closeRef}
          className="inspector-close"
          onClick={dismiss}
          aria-label={t('common.close')}
        >
          ×
        </button>
      </header>
      <div className="inspector-body">
        <div className="inspector-exhibit">
          <div className="inspector-art" key={item.card_id}>
            {preview ? (
              <PokemonCard card={preview} priority />
            ) : (
              <div className="collection-art-missing">{t('common.missing')}</div>
            )}
          </div>
          <nav className="inspector-navigation" aria-label={t('collection.album.navigation')}>
            <button
              type="button"
              disabled={index === 0}
              onClick={() => navigate(-1)}
              aria-label={t('common.previous')}
            >
              ←
            </button>
            <span
              role="status"
              aria-label={t('collection.design.progress', { current: index + 1, total })}
            >
              {String(index + 1).padStart(2, '0')} <small>/ {String(total).padStart(2, '0')}</small>
            </span>
            <button
              type="button"
              disabled={index === total - 1}
              onClick={() => navigate(1)}
              aria-label={t('common.next')}
            >
              →
            </button>
          </nav>
        </div>
        <div className="inspector-details">
          <span className="inspector-tier">
            {t('collection.tiers.' + definition.budget)} · Lumemon
          </span>
          <h2 id="inspector-title">{name}</h2>
          <p className="inspector-id">{item.card_id}</p>
          <div className="inspector-types">
            {species?.types.map((type) => (
              <span key={type}>{t('pokemonTypes.' + type)}</span>
            ))}
          </div>
          <dl className="inspector-facts">
            {art && (
              <div>
                <dt>{t('collection.album.expansion')}</dt>
                <dd>{art.set.name}</dd>
              </div>
            )}
            {preview?.illustrator && (
              <div>
                <dt>{t('common.artist')}</dt>
                <dd>{preview.illustrator}</dd>
              </div>
            )}
            {preview && (
              <div>
                <dt>{t('common.language')}</dt>
                <dd>{t(preview.language === 'es' ? 'common.spanish' : 'common.english')}</dd>
              </div>
            )}
            {preview?.rarityLabel && (
              <div>
                <dt>{t('common.rarity')}</dt>
                <dd>{preview.rarityLabel}</dd>
              </div>
            )}
          </dl>
          {preview && (
            <a
              className="collection-text-link inspector-source"
              href={preview.imageSourceUrl || preview.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('common.source')} ↗
            </a>
          )}
          <div className="inspector-ownership">
            <div>
              <span>{t('collection.album.inAlbum')}</span>
              <strong>{t('collection.album.owned', { count: item.quantity })}</strong>
            </div>
            <p>
              {item.quantity > 1
                ? t('collection.inventory.spare', { count: item.quantity - 1 })
                : t('collection.inventory.lastCopy')}
            </p>
            <Button
              variant="secondary"
              disabled={disabled || item.quantity < 2}
              onClick={() => {
                dismiss()
                choose({ kind: 'fragment', cardId: item.card_id, quantity: 1 })
              }}
            >
              {t('collection.inventory.fragment', { count: definition.fragment_value })}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  )
}
