import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { Button } from '../../components/ui/Button'
import type { CardPreview } from '../../types/card-preview'
import { sampleCards, missingImageSample } from './sample-cards'
import './DesignPreviewPage.css'

type Filter = 'all' | 'rare' | 'fallback'

function CardDetails({ card, onClose }: { card: CardPreview; onClose: () => void }) {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [])
  const isSample = card.origin === 'pokeprisma'
  const name = isSample ? t(card.name) : card.name
  return (
    <dialog
      ref={dialog}
      className="card-dialog"
      aria-labelledby="detail-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="dialog-inner">
        <button
          type="button"
          className="icon-button dialog-close"
          aria-label={t('common.close')}
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <div className="dialog-card">
          <PokemonCard card={card} priority />
        </div>
        <div className="dialog-info">
          <p className="eyebrow">{t(isSample ? 'common.custom' : 'common.official')}</p>
          <h2 id="detail-title">{name}</h2>
          <p className="detail-description">
            {t(isSample ? 'preview.noImageDetails' : 'preview.officialDetails')}
          </p>
          {!isSample && (
            <dl>
              <div>
                <dt>{t('common.rarity')}</dt>
                <dd>{t(`rarities.${card.rarityLabel}`, { defaultValue: card.rarityLabel })}</dd>
              </div>
              <div>
                <dt>{t('common.type')}</dt>
                <dd>
                  {card.typeLabels
                    .map((type) => t(`types.${type}`, { defaultValue: type }))
                    .join(' / ')}
                </dd>
              </div>
              <div>
                <dt>{t('common.language')}</dt>
                <dd>
                  {t(
                    card.language === 'en'
                      ? 'common.english'
                      : card.language === 'es'
                        ? 'common.spanish'
                        : 'common.other',
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('common.artist')}</dt>
                <dd>{card.illustrator}</dd>
              </div>
            </dl>
          )}
          <p className="detail-note">{t('common.cardNotice')}</p>
          {card.sourceUrl ? (
            <a
              className="button button-secondary"
              href={card.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t('common.source')}
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <Button variant="secondary" onClick={() => dialog.current?.close()}>
              {t('common.close')}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  )
}

export function DesignPreviewPage() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const cards = [...sampleCards, missingImageSample]
  const visible = cards.filter(
    (card) =>
      filter === 'all' ||
      (filter === 'fallback'
        ? card.imageUrl === null
        : card.rarityLabel === 'Secret Rare' || card.rarityLabel === 'Special illustration rare'),
  )
  const selected = cards.find((card) => card.id === selectedId)
  return (
    <div className="preview-page page-width section-space">
      <div className="preview-heading">
        <div>
          <p className="eyebrow">{t('preview.eyebrow')}</p>
          <h1>{t('preview.title')}</h1>
        </div>
        <div className="preview-intro">
          <span className="preview-badge">{t('common.preview')}</span>
          <p>{t('preview.description')}</p>
        </div>
      </div>
      <div className="preview-toolbar">
        <div className="filter-group" role="group" aria-label={t('preview.filters')}>
          {(['all', 'rare', 'fallback'] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {t(`preview.${value}`)}
            </button>
          ))}
        </div>
        <p aria-live="polite">{t('preview.count', { count: visible.length })}</p>
      </div>
      <div className="preview-grid">
        {visible.map((card) => (
          <article key={card.id} className="preview-item">
            <div className="preview-item-top">
              <span className="micro-label">{card.id}</span>
              <span aria-hidden="true">{card.origin === 'tcgdex' ? '✦' : '◇'}</span>
            </div>
            <PokemonCard card={card} onSelect={setSelectedId} />
            <div className="preview-card-caption">
              <h2>{card.origin === 'pokeprisma' ? t(card.name) : card.name}</h2>
              <p>
                {card.origin === 'pokeprisma'
                  ? t(card.rarityLabel)
                  : t(`rarities.${card.rarityLabel}`, { defaultValue: card.rarityLabel })}
              </p>
              <span>
                {t(card.origin === 'pokeprisma' ? 'common.custom' : 'common.official')}{' '}
                {card.origin === 'tcgdex' && '· EN'}
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className="preview-footnote">
        <span aria-hidden="true">✧</span>
        <div>
          <p>{t('preview.selection')}</p>
          <p>{t('preview.motion')}</p>
        </div>
        {filter !== 'all' && (
          <Button variant="secondary" onClick={() => setFilter('all')}>
            {t('preview.clear')}
          </Button>
        )}
      </div>
      {selected && (
        <CardDetails key={selected.id} card={selected} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
