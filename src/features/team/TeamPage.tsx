import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CardRecord } from '../../catalog/types'
import { selectTeamCard } from '../../battle/team-draft'
import { POKEMON_TEAM_SIZE, validatePokemonTeam } from '../../battle/team'
import { Button } from '../../components/ui/Button'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { useCatalog } from '../catalog/use-catalog'
import { toCardPreview } from '../catalog/to-card-preview'
import { TeamPicker } from './TeamPicker'
import { useTeamDraft } from './use-team-draft'
import '../catalog/CatalogPage.css'
import './TeamPage.css'

export function TeamPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'es'
  const catalog = useCatalog()
  const draft = useTeamDraft()
  const [notice, setNotice] = useState('')
  const summary = useRef<HTMLHeadingElement>(null)
  const searchArea = useRef<HTMLDivElement>(null)
  function recover() {
    catalog.retry()
    draft.retry()
  }
  if (catalog.error || draft.status === 'error')
    return (
      <div className="page-width section-space catalog-state" role="alert">
        <h1>{t('team.loadError')}</h1>
        <p>{t('team.retained')}</p>
        <Button onClick={recover}>{t('catalog.retry')}</Button>
      </div>
    )
  if (draft.status === 'invalid')
    return (
      <div className="page-width section-space catalog-state" role="alert">
        <h1>{t('team.invalidDraft')}</h1>
        <p>{t('team.invalidHint')}</p>
        <Button onClick={() => draft.commit([])}>{t('team.reset')}</Button>
      </div>
    )
  if (!catalog.data || draft.status === 'loading')
    return (
      <div className="page-width section-space catalog-state" role="status">
        <p>{t('catalog.loading')}</p>
      </div>
    )
  const species = new Set(catalog.data.species.map((entry) => entry.id))
  const validation = validatePokemonTeam(
    draft.cards.map((card) => card.id),
    new Map(draft.cards.map((card) => [card.id, card])),
    species,
  )
  function choose(card: CardRecord) {
    const next = selectTeamCard(draft.cards, card, species)
    const conflict =
      (next.kind === 'added' || next.kind === 'replaced') && !draft.commit(next.cards)
    setNotice(conflict ? 'team.notice.conflict' : `team.notice.${next.kind}`)
  }
  function edit(next: CardRecord[], message: string) {
    const committed = draft.commit(next)
    setNotice(committed ? message : 'team.notice.conflict')
    summary.current?.focus({ preventScroll: true })
  }
  function browse() {
    searchArea.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
    searchArea.current?.focus({ preventScroll: true })
  }
  return (
    <div className="page-width section-space team-page">
      <header className="team-heading">
        <div>
          <p className="eyebrow">{t('team.eyebrow')}</p>
          <h1>{t('team.title')}</h1>
          <p className="team-intro">{t('team.intro')}</p>
        </div>
        <div
          className={`team-meter ${validation.valid ? 'is-complete' : ''}`}
          aria-label={t('team.count', { count: draft.cards.length })}
        >
          <strong>
            {String(draft.cards.length).padStart(2, '0')}
            <span> / 06</span>
          </strong>
          <span>{t(validation.valid ? 'team.complete' : 'team.inProgress')}</span>
        </div>
      </header>
      <div className="team-local-note">
        <span className="team-local-dot" aria-hidden="true" />
        <p>{t('team.localNotice')}</p>
      </div>
      <section aria-labelledby="team-roster-title">
        <div className="team-roster-heading">
          <h2 ref={summary} tabIndex={-1} id="team-roster-title">
            {t('team.roster')}
          </h2>
          <span className={draft.saved ? 'team-saved' : 'team-unsaved'} role="status">
            {t(draft.saved ? 'team.saved' : 'team.memory')}
          </span>
        </div>
        <ol className="team-slots">
          {Array.from({ length: POKEMON_TEAM_SIZE }, (_, slot) => {
            const card = draft.cards[slot]
            const view = card ? toCardPreview(card, locale) : undefined
            return (
              <li className={`team-slot ${card ? 'is-filled' : ''}`} key={slot}>
                <div className="team-slot-label">
                  <span>{String(slot + 1).padStart(2, '0')}</span>
                  <span>{t(slot === 0 ? 'team.lead' : 'team.reserve')}</span>
                </div>
                {card && view ? (
                  <>
                    <PokemonCard card={view} />
                    <h3>{view.name}</h3>
                    <p className="team-card-id">
                      {card.id} · {view.language.toUpperCase()}
                    </p>
                    <div className="team-slot-actions">
                      {slot > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            edit(
                              [card, ...draft.cards.filter((entry) => entry.id !== card.id)],
                              'team.notice.promoted',
                            )
                          }
                          aria-label={t('team.promoteName', { name: view.name })}
                        >
                          {t('team.promote')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          edit(
                            draft.cards.filter((entry) => entry.id !== card.id),
                            'team.notice.removed',
                          )
                        }
                        aria-label={t('team.removeName', { name: view.name })}
                      >
                        {t('team.remove')}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    className="team-empty-slot"
                    onClick={browse}
                    aria-label={t('team.addSlot', { slot: slot + 1 })}
                  >
                    <span aria-hidden="true">+</span>
                    <span>{t('team.emptySlot')}</span>
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      </section>
      <div className="team-feedback" role="status" aria-live="polite">
        {(notice && t(notice)) ||
          t(validation.valid ? 'team.completeHint' : 'team.remaining', {
            count: POKEMON_TEAM_SIZE - draft.cards.length,
          })}
      </div>
      <div ref={searchArea} tabIndex={-1}>
        <TeamPicker species={catalog.data.species} team={draft.cards} onChoose={choose} />
      </div>
    </div>
  )
}
