import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { listSpecies } from '../../catalog/repository'
import type { SpeciesRecord } from '../../catalog/types'
import { Button } from '../../components/ui/Button'
import { PrismMark } from '../../components/ui/PrismMark'
import { CatalogFilters } from './CatalogFilters'
import { useCatalog } from './use-catalog'
import './CatalogPage.css'

function SpeciesTile({ species, query }: { species: SpeciesRecord; query: string }) {
  const { t, i18n } = useTranslation()
  const [failed, setFailed] = useState(false)
  const name = species.names[i18n.resolvedLanguage === 'en' ? 'en' : 'es']
  return (
    <Link
      className={`species-tile species-${species.types[0]}`}
      to={`/catalogo/${species.id}${query}`}
      aria-label={t('catalog.openSpecies', { name })}
    >
      <div className="species-tile-top">
        <span>#{String(species.id).padStart(4, '0')}</span>
        <span>
          {t('catalog.genShort')} {species.generation}
        </span>
      </div>
      <div className="species-art">
        <span className="species-orbit" aria-hidden="true" />
        {!failed && species.imageUrl ? (
          <img
            src={species.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            width="240"
            height="240"
            onError={() => setFailed(true)}
          />
        ) : (
          <>
            <PrismMark />
            <span className="missing-species">{t('common.missing')}</span>
          </>
        )}
      </div>
      <h2>{name}</h2>
      <div className="type-chips">
        {species.types.map((type) => (
          <span key={type} className={`type-chip type-${type}`}>
            {t(`pokemonTypes.${type}`, { defaultValue: type })}
          </span>
        ))}
      </div>
      <div className="species-tile-bottom">
        <span>{t('catalog.variants', { count: species.cardCount })}</span>
        <span aria-hidden="true">↗</span>
      </div>
    </Link>
  )
}
export function CatalogPage() {
  const { t, i18n } = useTranslation()
  const resultsHeading = useRef<HTMLDivElement>(null)
  const [params, setParams] = useSearchParams()
  const { data, error, retry } = useCatalog()
  function change(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
    if (key === 'page') {
      resultsHeading.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
      resultsHeading.current?.focus({ preventScroll: true })
    }
  }
  if (error)
    return (
      <div className="page-width section-space catalog-state" role="alert">
        <h1>{t('catalog.errorTitle')}</h1>
        <p>{t('catalog.errorBody')}</p>
        <Button onClick={retry}>{t('catalog.retry')}</Button>
      </div>
    )
  if (!data)
    return (
      <div className="page-width section-space catalog-state" role="status">
        <PrismMark />
        <p>{t('catalog.loading')}</p>
      </div>
    )
  const { manifest, species } = data
  const result = listSpecies(species, {
    search: params.get('q') || '',
    generation: params.get('generation') || '',
    type: params.get('type') || '',
    rarity: params.get('rarity') || '',
    set: params.get('set') || '',
    page: Number(params.get('page') || 1),
    locale: i18n.resolvedLanguage === 'en' ? 'en' : 'es',
  })
  const hasFilters = ['q', 'generation', 'type', 'rarity', 'set'].some((key) => params.has(key))
  const query = params.toString() ? `?${params}` : ''
  return (
    <div className="catalog-page page-width section-space">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">{t('catalog.eyebrow')}</p>
          <h1>{t('catalog.title')}</h1>
          <p className="catalog-description">{t('catalog.description')}</p>
        </div>
        <div className="catalog-counts">
          <div>
            <strong>{manifest.species.toLocaleString(i18n.language)}</strong>
            <span>{t('catalog.species')}</span>
          </div>
          <div>
            <strong>{manifest.pokemonCards.toLocaleString(i18n.language)}</strong>
            <span>{t('catalog.pokemonCards')}</span>
          </div>
          <small>
            {t('catalog.snapshot', {
              date: new Date(manifest.generatedAt).toLocaleDateString(i18n.language),
            })}
          </small>
        </div>
      </div>
      <CatalogFilters params={params} manifest={manifest} species={species} onChange={change} />
      <div className="catalog-results-heading" ref={resultsHeading} tabIndex={-1}>
        <p role="status">
          {t('catalog.results', { count: result.total })}
          <span> / {t('catalog.page', { page: result.page, pages: result.pages })}</span>
        </p>
        {hasFilters && (
          <button className="clear-filters" type="button" onClick={() => setParams({})}>
            {t('catalog.clear')} ×
          </button>
        )}
      </div>
      {result.total ? (
        <div className="species-grid">
          {result.items.map((s) => (
            <SpeciesTile key={s.id} species={s} query={query} />
          ))}
        </div>
      ) : (
        <div className="catalog-empty">
          <PrismMark />
          <h2>{t('catalog.emptyTitle')}</h2>
          <p>{t('catalog.emptyBody')}</p>
          <Button variant="secondary" onClick={() => setParams({})}>
            {t('catalog.clear')}
          </Button>
        </div>
      )}
      {result.pages > 1 && (
        <nav className="catalog-pagination" aria-label={t('catalog.pagination')}>
          <Button
            variant="secondary"
            disabled={result.page === 1}
            onClick={() => change('page', String(result.page - 1))}
          >
            ← {t('catalog.previous')}
          </Button>
          <span>{t('catalog.page', { page: result.page, pages: result.pages })}</span>
          <Button
            variant="secondary"
            disabled={result.page === result.pages}
            onClick={() => change('page', String(result.page + 1))}
          >
            {t('catalog.next')} →
          </Button>
        </nav>
      )}
      <p className="catalog-disclaimer">{t('catalog.notice')}</p>
    </div>
  )
}
