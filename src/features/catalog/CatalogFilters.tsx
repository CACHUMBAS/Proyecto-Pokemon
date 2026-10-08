import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CatalogManifest, SpeciesRecord } from '../../catalog/types'
import { Button } from '../../components/ui/Button'

export function CatalogFilters({
  params,
  manifest,
  species,
  onChange,
}: {
  params: URLSearchParams
  manifest: CatalogManifest
  species: SpeciesRecord[]
  onChange: (key: string, value: string) => void
}) {
  const { t } = useTranslation()
  const query = params.get('q') || ''
  const [search, setSearch] = useState({ query, draft: query })
  if (search.query !== query) setSearch({ query, draft: query })
  const generations = [...new Set(species.map((s) => s.generation))].sort((a, b) => a - b)
  const types = [...new Set(species.flatMap((s) => s.types))].sort()
  return (
    <div className="catalog-filters">
      <form
        className="catalog-search"
        onSubmit={(event) => {
          event.preventDefault()
          onChange('q', String(new FormData(event.currentTarget).get('q') || '').trim())
        }}
      >
        <label className="sr-only" htmlFor="catalog-search">
          {t('catalog.search')}
        </label>
        <span aria-hidden="true">⌕</span>
        <input
          id="catalog-search"
          name="q"
          type="search"

          value={search.draft}
          onChange={(event) => setSearch({ query, draft: event.target.value })}
          placeholder={t('catalog.placeholder')}
          maxLength={100}
        />
        <Button type="submit">{t('catalog.searchButton')}</Button>
      </form>
      <div className="catalog-filter-row">
        <label>
          {t('catalog.generation')}
          <select
            value={params.get('generation') || ''}
            onChange={(event) => onChange('generation', event.target.value)}
          >
            <option value="">{t('catalog.allGenerations')}</option>
            {generations.map((g) => (
              <option key={g} value={g}>
                {t('catalog.generationNumber', { number: g })}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('catalog.type')}
          <select
            value={params.get('type') || ''}
            onChange={(event) => onChange('type', event.target.value)}
          >
            <option value="">{t('catalog.allTypes')}</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {t(`pokemonTypes.${type}`, { defaultValue: type })}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('catalog.rarity')}
          <select
            value={params.get('rarity') || ''}
            onChange={(event) => onChange('rarity', event.target.value)}
          >
            <option value="">{t('catalog.allRarities')}</option>
            {manifest.rarities.map((r) => (
              <option key={r} value={r}>
                {t(`rarities.${r}`, { defaultValue: r })}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('catalog.set')}
          <select
            value={params.get('set') || ''}
            onChange={(event) => onChange('set', event.target.value)}
          >
            <option value="">{t('catalog.allSets')}</option>
            {manifest.sets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
