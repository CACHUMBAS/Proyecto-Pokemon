import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { CollectionSnapshot, CollectionCommand } from '../../collection/types'
import { CollectionCard } from './CollectionCard'
import { CardInspector } from './CardInspector'
import './CollectionAlbum.css'
import { cardLabel, collectionArtwork, collectionSpecies } from './card-data'
export function Inventory({
  data,
  disabled,
  choose,
}: {
  data: CollectionSnapshot
  disabled: boolean
  choose: (c: CollectionCommand) => void
}) {
  const { t, i18n } = useTranslation(),
    locale = i18n.language === 'en' ? 'en' : 'es'
  const [search, setSearch] = useState(''),
    [budget, setBudget] = useState(''),
    [duplicates, setDuplicates] = useState(false),
    [type, setType] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const query = search.trim().toLocaleLowerCase(locale)
  const cards = data.inventory.filter((item) => {
    const def = data.cards.find((c) => c.card_id === item.card_id)!
    const art = collectionArtwork.get(item.card_id)
    return (
      (!duplicates || item.quantity > 1) &&
      (!budget || def.budget === Number(budget)) &&
      (!type || collectionSpecies.get(def.species_id)?.types.includes(type)) &&
      (!query ||
        (cardLabel(item.card_id, locale) + ' ' + item.card_id + ' ' + (art?.set.name ?? ''))
          .toLocaleLowerCase(locale)
          .includes(query))
    )
  })
  const selectedIndex = cards.findIndex((item) => item.card_id === selectedId)
  const hasFilters = Boolean(search || budget || type || duplicates)
  const clearFilters = () => {
    setSearch('')
    setBudget('')
    setType('')
    setDuplicates(false)
  }
  const copies = data.inventory.reduce((total, item) => total + item.quantity, 0)
  return (
    <section className="collection-album" aria-labelledby="inventory-title">
      <div className="collection-section-heading">
        <div>
          <span className="eyebrow">{t('collection.inventory.eyebrow')}</span>
          <h2 id="inventory-title">{t('collection.album.title')}</h2>
        </div>
        <Link className="collection-text-link" to="/sobres">
          {t('collection.inventory.toPacks')} ↗
        </Link>
      </div>
      <div className="album-overview">
        <div className="album-progress">
          <div>
            <span>{t('collection.album.progress')}</span>
            <strong>
              {data.inventory.length}
              <small> / {data.cards.length}</small>
            </strong>
          </div>
          <meter
            min={0}
            max={data.cards.length || 1}
            value={data.inventory.length}
            aria-label={t('collection.album.progress')}
          />
          <p>{t('collection.album.progressNote')}</p>
        </div>
        <div className="album-number">
          <strong>{copies}</strong>
          <span>{t('collection.album.copies')}</span>
        </div>
        <div className="album-number">
          <strong>{copies - data.inventory.length}</strong>
          <span>{t('collection.album.spares')}</span>
        </div>
      </div>
      <div className="collection-filters">
        <label>
          {t('collection.inventory.search')}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('collection.inventory.placeholder')}
          />
        </label>
        <label>
          {t('collection.inventory.tier')}
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option value="">{t('collection.inventory.all')}</option>
            {data.pack.odds.map((o) => (
              <option key={o.budget} value={o.budget}>
                {t('collection.tiers.' + o.budget)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('collection.inventory.type')}
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t('collection.inventory.all')}</option>
            {Array.from(
              new Set(data.cards.flatMap((c) => collectionSpecies.get(c.species_id)?.types ?? [])),
            )
              .sort()
              .map((type) => (
                <option key={type} value={type}>
                  {t('pokemonTypes.' + type)}
                </option>
              ))}
          </select>
        </label>
        <label className="collection-check">
          <input
            type="checkbox"
            checked={duplicates}
            onChange={(e) => setDuplicates(e.target.checked)}
          />
          {t('collection.inventory.duplicates')}
        </label>
      </div>
      <div className="album-results">
        <p role="status">
          {t('collection.inventory.count', { count: cards.length, total: data.inventory.length })}
        </p>
        {hasFilters ? (
          <button type="button" onClick={clearFilters}>
            {t('collection.album.clear')} <span aria-hidden="true">×</span>
          </button>
        ) : (
          <span>{t('collection.album.hint')}</span>
        )}
      </div>
      {cards.length ? (
        <div className="album-grid">
          {cards.map((item) => {
            const def = data.cards.find((c) => c.card_id === item.card_id)!
            return (
              <article className={'album-card tier-' + def.budget} key={item.card_id}>
                <div className="album-card-top">
                  <span>{t('collection.tiers.' + def.budget)}</span>
                  <strong aria-label={t('collection.album.owned', { count: item.quantity })}>
                    ×{item.quantity}
                  </strong>
                </div>
                <CollectionCard id={item.card_id} onSelect={setSelectedId} />
                <div className="album-card-bottom">
                  <span>
                    {item.quantity > 1
                      ? t('collection.inventory.spare', { count: item.quantity - 1 })
                      : t('collection.album.inAlbum')}
                  </span>
                  <span aria-hidden="true">↗</span>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="album-empty">
          <span aria-hidden="true">◇</span>
          <h3>{t('collection.inventory.empty')}</h3>
          <p>{t('collection.album.emptyHint')}</p>
          <button type="button" onClick={clearFilters}>
            {t('collection.album.clear')}
          </button>
        </div>
      )}
      <p className="collection-footnote">{t('collection.inventory.localTeam')}</p>
      {selectedIndex >= 0 && (
        <CardInspector
          item={cards[selectedIndex]}
          definition={data.cards.find((card) => card.card_id === selectedId)!}
          index={selectedIndex}
          total={cards.length}
          disabled={disabled}
          navigate={(direction) => setSelectedId(cards[selectedIndex + direction].card_id)}
          close={() => setSelectedId(null)}
          choose={choose}
        />
      )}
    </section>
  )
}
