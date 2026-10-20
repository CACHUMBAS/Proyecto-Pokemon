import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import type { CollectionSnapshot, CollectionCommand } from '../../collection/types'
import { Button } from '../../components/ui/Button'
import { CollectionCard } from './CollectionCard'
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
  return (
    <section aria-labelledby="inventory-title">
      <div className="collection-section-heading">
        <div>
          <span className="eyebrow">{t('collection.inventory.eyebrow')}</span>
          <h2 id="inventory-title">{t('collection.inventory.title')}</h2>
        </div>
        <Link className="collection-text-link" to="/sobres">
          {t('collection.inventory.toPacks')} ↗
        </Link>
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
      <p className="collection-footnote" role="status">
        {t('collection.inventory.count', { count: cards.length, total: data.inventory.length })}
      </p>
      {cards.length ? (
        <div className="collection-inventory-grid">
          {cards.map((item) => {
            const def = data.cards.find((c) => c.card_id === item.card_id)!
            return (
              <article className={'collection-owned tier-' + def.budget} key={item.card_id}>
                <div className="collection-owned-top">
                  <span>{t('collection.tiers.' + def.budget)}</span>
                  <strong>×{item.quantity}</strong>
                </div>
                <CollectionCard id={item.card_id} />
                <p className="collection-owned-note">
                  {item.quantity > 1
                    ? t('collection.inventory.spare', { count: item.quantity - 1 })
                    : t('collection.inventory.lastCopy')}
                </p>
                <Button
                  variant="secondary"
                  disabled={disabled || item.quantity < 2}
                  onClick={() => choose({ kind: 'fragment', cardId: item.card_id, quantity: 1 })}
                >
                  {t('collection.inventory.fragment', { count: def.fragment_value })}
                </Button>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="collection-notice">{t('collection.inventory.empty')}</p>
      )}
      <p className="collection-footnote">{t('collection.inventory.localTeam')}</p>
    </section>
  )
}
