import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { CardRecord } from '../../catalog/types'
import { catalogRepository } from '../../catalog/client'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { Button } from '../../components/ui/Button'
import { useCatalog } from './use-catalog'
import { orderVariants, toCardPreview } from './to-card-preview'
import './CatalogPage.css'

function VariantDialog({ card, onClose }: { card: CardRecord; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [])
  const view = toCardPreview(card, i18n.resolvedLanguage === 'en' ? 'en' : 'es', 'high')
  return (
    <dialog
      ref={dialog}
      className="variant-dialog"
      aria-labelledby="variant-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
    >
      <div className="variant-dialog-inner">
        <button
          type="button"
          className="icon-button variant-close"
          aria-label={t('common.close')}
          onClick={() => dialog.current?.close()}
        >
          ×
        </button>
        <PokemonCard card={view} priority />
        <div>
          <p className="eyebrow">{card.id}</p>
          <h2 id="variant-title">{view.name}</h2>
          <dl>
            <div>
              <dt>{t('common.language')}</dt>
              <dd>{t(view.language === 'es' ? 'common.spanish' : 'common.english')}</dd>
            </div>
            <div>
              <dt>{t('catalog.set')}</dt>
              <dd>{card.set.name}</dd>
            </div>
            <div>
              <dt>{t('catalog.rarity')}</dt>
              <dd>{t(`rarities.${card.rarity}`, { defaultValue: card.rarity })}</dd>
            </div>
            <div>
              <dt>{t('common.type')}</dt>
              <dd>
                {card.tcgTypes
                  .map((type) => t(`types.${type}`, { defaultValue: type }))
                  .join(' / ') || '—'}
              </dd>
            </div>
            {card.illustrator && (
              <div>
                <dt>{t('common.artist')}</dt>
                <dd>{card.illustrator}</dd>
              </div>
            )}
          </dl>
          {card.mapping !== 'species' && <p className="mapping-note">{t('catalog.ambiguous')}</p>}
          <p className="catalog-disclaimer">{t('catalog.cardNotice')}</p>
          <a
            className="button button-secondary"
            href={view.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t('common.source')} ↗
          </a>
        </div>
      </div>
    </dialog>
  )
}
export function SpeciesDetails() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const speciesId = Number(id)
  const resultsHeading = useRef<HTMLDivElement>(null)
  const [params, setParams] = useSearchParams()
  const { data, error, retry } = useCatalog()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; cards?: CardRecord[]; error?: boolean }>({
    key: '',
  })
  const [selected, setSelected] = useState<CardRecord | null>(null)
  const key = `${speciesId}/${attempt}`
  useEffect(() => {
    let active = true
    void catalogRepository
      .listVariants(speciesId)
      .then((cards) => {
        if (active) setResult({ key, cards })
      })
      .catch(() => {
        if (active) setResult({ key, error: true })
      })
    return () => {
      active = false
    }
  }, [speciesId, key])
  const species = data?.species.find((s) => s.id === speciesId)
  const cards = result.key === key ? result.cards : undefined
  const detailError = result.key === key && result.error
  const back = new URLSearchParams(params)
  back.delete('vp')
  function recover() {
    retry()
    setAttempt((n) => n + 1)
  }
  if (data && !species)
    return (
      <div className="page-width section-space catalog-state">
        <h1>{t('catalog.unknownSpecies')}</h1>
        <Link className="button button-primary" to="/catalogo">
          {t('catalog.back')}
        </Link>
      </div>
    )
  if (error || detailError)
    return (
      <div className="page-width section-space catalog-state" role="alert">
        <h1>{t('catalog.errorTitle')}</h1>
        <p>{t('catalog.errorBody')}</p>
        <Button onClick={recover}>{t('catalog.retry')}</Button>
        <Link className="text-link" to="/catalogo">
          {t('catalog.back')}
        </Link>
      </div>
    )
  if (!data || !species || !cards)
    return (
      <div className="page-width section-space catalog-state" role="status">
        <p>{t('catalog.loading')}</p>
      </div>
    )
  const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'es'
  const filtered = orderVariants(cards).filter(
    (card) =>
      (!params.get('rarity') || card.rarity === params.get('rarity')) &&
      (!params.get('set') || card.set.id === params.get('set')),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    page = Math.max(1, Math.min(pages, Math.trunc(Number(params.get('vp'))) || 1))
  const visible = filtered.slice((page - 1) * 12, page * 12)
  function turn(target: number) {
    const next = new URLSearchParams(params)
    next.set('vp', String(target))
    setParams(next)
    resultsHeading.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
    resultsHeading.current?.focus({ preventScroll: true })
  }
  return (
    <div className="species-detail page-width section-space">
      <Link className="text-link" to={`/catalogo${back.size ? `?${back}` : ''}`}>
        ← {t('catalog.back')}
      </Link>
      <div className="species-detail-heading">
        <div>
          <p className="eyebrow">
            #{String(species.id).padStart(4, '0')} /{' '}
            {t('catalog.generationNumber', { number: species.generation })}
          </p>
          <h1>{species.names[locale]}</h1>
          <div className="type-chips">
            {species.types.map((type) => (
              <span className={`type-chip type-${type}`} key={type}>
                {t(`pokemonTypes.${type}`, { defaultValue: type })}
              </span>
            ))}
          </div>
        </div>
        <div>
          <strong className="detail-count">
            {cards.filter((c) => c.origin === 'tcgdex').length}
          </strong>
          <p>{t('catalog.availableVariants')}</p>
        </div>
      </div>
      <p className="catalog-description">{t('catalog.detailIntro')}</p>
      {species.forms.length > 1 && (
        <details className="species-forms">
          <summary>{t('catalog.forms', { count: species.forms.length })}</summary>
          <p>{t('catalog.formsNote')}</p>
          <ul>
            {species.forms.map((form) => (
              <li key={form.id}>{form.slug}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="catalog-results-heading" ref={resultsHeading} tabIndex={-1}>
        <p role="status">{t('catalog.cardsFound', { count: filtered.length })}</p>
        {(params.has('rarity') || params.has('set')) && (
          <button
            className="clear-filters"
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params)
              next.delete('rarity')
              next.delete('set')
              next.delete('vp')
              setParams(next)
            }}
          >
            {t('catalog.clearCardFilters')} ×
          </button>
        )}
      </div>
      {visible.length ? (
        <div className="variants-grid">
          {visible.map((card) => {
            const view = toCardPreview(card, locale)
            return (
              <article key={card.id} className="variant-item">
                <div className="variant-item-top">
                  <span>{card.id}</span>
                  <span>{view.language.toUpperCase()}</span>
                </div>
                <PokemonCard card={view} onSelect={() => setSelected(card)} />
                <h2>{view.name}</h2>
                <p>{t(`rarities.${card.rarity}`, { defaultValue: card.rarity })}</p>
                <span>{card.set.name}</span>
                {view.imageUrl && view.language !== locale && (
                  <small className="language-fallback">
                    {t('catalog.languageFallback', {
                      language: t(view.language === 'es' ? 'common.spanish' : 'common.english'),
                    })}
                  </small>
                )}
                {card.mapping !== 'species' && (
                  <small className="mapping-note">{t('catalog.ambiguousShort')}</small>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="catalog-empty">
          <h2>{t('catalog.emptyTitle')}</h2>
          <p>{t('catalog.emptyBody')}</p>
        </div>
      )}
      {pages > 1 && (
        <nav className="catalog-pagination" aria-label={t('catalog.pagination')}>
          <Button variant="secondary" disabled={page === 1} onClick={() => turn(page - 1)}>
            ← {t('catalog.previous')}
          </Button>
          <span>{t('catalog.page', { page, pages })}</span>
          <Button variant="secondary" disabled={page === pages} onClick={() => turn(page + 1)}>
            {t('catalog.next')} →
          </Button>
        </nav>
      )}
      <p className="catalog-disclaimer">{t('catalog.cardNotice')}</p>
      {selected && (
        <VariantDialog key={selected.id} card={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
