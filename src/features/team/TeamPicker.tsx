import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { catalogRepository } from '../../catalog/client'
import { listTeamSpecies, listTeamVariants } from '../../battle/team-catalog'
import type { CardRecord, SpeciesRecord } from '../../catalog/types'
import { selectTeamCard } from '../../battle/team-draft'
import { Button } from '../../components/ui/Button'
import { TeamBattleDetails } from './TeamBattleDetails'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { orderVariants, toCardPreview } from '../catalog/to-card-preview'

function PlayableFilter({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const { t } = useTranslation()
  const hintId = useId()
  return (
    <div className="team-playable-filter">
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={hintId}
        />
        <span>{t('team.playableOnly')}</span>
      </label>
      <p id={hintId}>{t('team.playableHint')}</p>
    </div>
  )
}

function VariantPicker({
  species,
  team,
  knownSpecies,
  playableOnly,
  onPlayableOnlyChange,
  onChoose,
  onBack,
}: {
  species: SpeciesRecord
  team: CardRecord[]
  knownSpecies: ReadonlySet<number>
  playableOnly: boolean
  onPlayableOnlyChange: (checked: boolean) => void
  onChoose: (card: CardRecord) => void
  onBack: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'es'
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ attempt: number; cards?: CardRecord[]; error?: boolean }>({
    attempt: -1,
  })
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    let active = true
    void catalogRepository.listVariants(species.id).then(
      (cards) => {
        if (active) setResult({ attempt, cards: orderVariants(cards) })
      },
      () => {
        if (active) setResult({ attempt, error: true })
      },
    )
    return () => {
      active = false
    }
  }, [species.id, attempt])
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [])
  const cards = result.attempt === attempt ? result.cards : undefined
  const filtered = listTeamVariants(cards ?? [], filter, playableOnly)
  const pages = Math.max(1, Math.ceil(filtered.length / 12))
  const currentPage = Math.min(page, pages)
  function turn(next: number) {
    setPage(next)
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    heading.current?.focus({ preventScroll: true })
  }
  return (
    <>
      <Button variant="secondary" onClick={onBack}>
        ← {t('team.changeSpecies')}
      </Button>
      <h2 ref={heading} tabIndex={-1} className="team-picker-title">
        {t('team.variantsTitle', { name: species.names[locale] })}
      </h2>
      <p className="team-hint">{t('team.variantHint')}</p>
      <PlayableFilter
        checked={playableOnly}
        onChange={(checked) => {
          onPlayableOnlyChange(checked)
          setPage(1)
        }}
      />
      {!cards && !(result.attempt === attempt && result.error) && (
        <p role="status">{t('catalog.loading')}</p>
      )}
      {result.attempt === attempt && result.error && (
        <div role="alert">
          <p>{t('catalog.errorBody')}</p>
          <Button onClick={() => setAttempt((n) => n + 1)}>{t('catalog.retry')}</Button>
        </div>
      )}
      {cards && (
        <>
          <label className="team-search">
            {t('team.filterVariants')}
            <input
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value)
                setPage(1)
              }}
              type="search"
            />
          </label>
          <p className="team-hint" role="status">
            {t('catalog.cardsFound', { count: filtered.length })}
          </p>
          <div className="variants-grid team-variants">
            {filtered.slice((currentPage - 1) * 12, currentPage * 12).map((card) => {
              const view = toCardPreview(card, locale)
              const choice = selectTeamCard(team, card, knownSpecies).kind
              const disabled =
                choice === 'full' || choice === 'ineligible' || choice === 'unchanged'
              const action =
                choice === 'replaced'
                  ? 'replace'
                  : choice === 'unchanged'
                    ? 'selected'
                    : choice === 'full'
                      ? 'full'
                      : choice === 'ineligible'
                        ? 'ineligible'
                        : 'add'
              return (
                <article className="variant-item" key={card.id}>
                  <div className="variant-item-top">
                    <span>{card.id}</span>
                    <span>{view.language.toUpperCase()}</span>
                  </div>
                  <PokemonCard card={view} />
                  <h3>{view.name}</h3>
                  <p>
                    {card.set.name} · {t(`rarities.${card.rarity}`, { defaultValue: card.rarity })}
                  </p>
                  <TeamBattleDetails card={card} name={view.name} />
                  <Button
                    variant={choice === 'unchanged' ? 'secondary' : 'primary'}
                    disabled={disabled}
                    onClick={() => onChoose(card)}
                    aria-label={`${t(`team.${action}`)}: ${view.name} · ${card.id}`}
                  >
                    {t(`team.${action}`)}
                  </Button>
                </article>
              )
            })}
          </div>
          {!filtered.length && (
            <p>{t(playableOnly ? 'team.playableEmpty' : 'catalog.emptyBody')}</p>
          )}
          {pages > 1 && (
            <nav className="catalog-pagination" aria-label={t('catalog.pagination')}>
              <Button
                variant="secondary"
                disabled={currentPage === 1}
                onClick={() => turn(currentPage - 1)}
              >
                ← {t('catalog.previous')}
              </Button>
              <span>{t('catalog.page', { page: currentPage, pages })}</span>
              <Button
                variant="secondary"
                disabled={currentPage === pages}
                onClick={() => turn(currentPage + 1)}
              >
                {t('catalog.next')} →
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  )
}

export function TeamPicker({
  species,
  team,
  onChoose,
}: {
  species: SpeciesRecord[]
  team: CardRecord[]
  onChoose: (card: CardRecord) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'es'
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [playableOnly, setPlayableOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SpeciesRecord | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const types = useMemo(() => [...new Set(species.flatMap((s) => s.types))].sort(), [species])
  const result = listTeamSpecies(
    species,
    {
      search,
      type: typeFilter || undefined,
      page,
      pageSize: 12,
      locale,
    },
    playableOnly,
  )
  const knownSpecies = new Set(species.map((entry) => entry.id))
  function turn(next: number) {
    setPage(next)
    heading.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
    heading.current?.focus({ preventScroll: true })
  }
  return (
    <section className="team-picker" aria-label={t('team.picker')}>
      {selected ? (
        <VariantPicker
          key={selected.id}
          species={selected}
          team={team}
          knownSpecies={knownSpecies}
          playableOnly={playableOnly}
          onPlayableOnlyChange={(checked) => {
            setPlayableOnly(checked)
            setPage(1)
          }}
          onChoose={onChoose}
          onBack={() => {
            setSelected(null)
            requestAnimationFrame(() => input.current?.focus())
          }}
        />
      ) : (
        <>
          <div className="team-picker-heading">
            <div>
              <p className="eyebrow">{t('team.step')}</p>
              <h2 ref={heading} tabIndex={-1}>
                {t('team.picker')}
              </h2>
            </div>
            <p>{t('team.pickerHint')}</p>
          </div>
          <div className="team-picker-controls">
            <label className="team-search">
              {t('team.search')}
              <input
                ref={input}
                type="search"
                value={search}
                placeholder={t('team.searchPlaceholder')}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </label>
            <label className="team-type-filter">
              {t('team.typeFilter')}
              <select
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value)
                  setPage(1)
                }}
              >
                <option value="">{t('team.allTypes')}</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {t(`pokemonTypes.${type}`, { defaultValue: type })}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <PlayableFilter
            checked={playableOnly}
            onChange={(checked) => {
              setPlayableOnly(checked)
              setPage(1)
            }}
          />
          <p className="team-hint" role="status">
            {t('team.speciesCount', { count: result.total })}
          </p>
          <div className="team-species-grid">
            {result.items.map((entry) => (
              <button
                key={entry.id}
                className="team-species"
                type="button"
                onClick={() => setSelected(entry)}
                aria-label={t('team.chooseSpecies', { name: entry.names[locale] })}
              >
                <span className="team-species-number">#{String(entry.id).padStart(4, '0')}</span>
                <strong>{entry.names[locale]}</strong>
                <span>
                  {entry.types
                    .map((type) => t(`pokemonTypes.${type}`, { defaultValue: type }))
                    .join(' / ')}
                </span>
                <span aria-hidden="true">
                  {team.some((card) => card.speciesIds[0] === entry.id) ? '✓' : '+'}
                </span>
              </button>
            ))}
          </div>
          {!result.total && <p>{t(playableOnly ? 'team.playableEmpty' : 'catalog.emptyBody')}</p>}
          {result.pages > 1 && (
            <nav className="catalog-pagination" aria-label={t('catalog.pagination')}>
              <Button
                variant="secondary"
                disabled={result.page === 1}
                onClick={() => turn(result.page - 1)}
              >
                ← {t('catalog.previous')}
              </Button>
              <span>{t('catalog.page', { page: result.page, pages: result.pages })}</span>
              <Button
                variant="secondary"
                disabled={result.page === result.pages}
                onClick={() => turn(result.page + 1)}
              >
                {t('catalog.next')} →
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
