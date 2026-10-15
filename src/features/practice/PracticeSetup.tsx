import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { PracticeCard } from './PracticeCard'
import { cards, cardsById, species, fighterName } from './practice-data'

interface Props {
  team: string[]
  onTeamChange: (team: string[]) => void
  onStart: () => void
  onTutorial: () => void
}
export function PracticeSetup({ team, onTeamChange, onStart, onTutorial }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'es'
  const [preferences, setPreferences] = useState<Record<number, string>>({})
  return (
    <>
      <div className="practice-intro">
        <div>
          <p className="eyebrow">{t('practice.eyebrow')}</p>
          <h1>{t('practice.title')}</h1>
          <p className="practice-description">{t('practice.description')}</p>
          <div className="practice-facts">
            <span>
              06 <small>{t('practice.fighters')}</small>
            </span>
            <span>
              {species.length} <small>{t('practice.species')}</small>
            </span>
            <span>
              {cards.length} <small>{t('practice.artworks')}</small>
            </span>
          </div>
        </div>
        <aside className="practice-ready" aria-label={t('practice.yourTeam')}>
          <div className="practice-ready-top">
            <span className="micro-label">{t('practice.yourTeam')}</span>
            <strong>{team.length}/6</strong>
          </div>
          <ol className="practice-lineup">
            {team.map((id, index) => (
              <li key={id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{fighterName(id, locale)}</strong>
                {index === 0 && <small>{t('practice.lead')}</small>}
              </li>
            ))}
          </ol>
          {team.length < 6 && (
            <p role="status">{t('practice.missing', { count: 6 - team.length })}</p>
          )}
          <Button disabled={team.length !== 6} onClick={onStart}>
            {t('practice.start')} <span aria-hidden="true">↗</span>
          </Button>
          <p className="practice-note">{t('practice.localNotice')}</p>
          <div className="tutorial-entry">
            <p className="eyebrow">{t('tutorial.entryTitle')}</p>
            <p>{t('tutorial.entryBody')}</p>
            <Button variant="secondary" onClick={onTutorial}>
              {t('tutorial.start')}
            </Button>
          </div>
        </aside>
      </div>
      <details className="practice-rules">
        <summary>{t('practice.howTo')}</summary>
        <ol>
          <li>{t('practice.rule1')}</li>
          <li>{t('practice.rule2')}</li>
          <li>{t('practice.rule3')}</li>
        </ol>
        <p>{t('practice.adapted')}</p>
      </details>
      <section aria-labelledby="practice-roster-title">
        <div className="practice-section-heading">
          <div>
            <p className="eyebrow">{t('practice.rosterEyebrow')}</p>
            <h2 id="practice-roster-title">{t('practice.rosterTitle')}</h2>
          </div>
          <p>{t('practice.rosterHint', { count: species.length })}</p>
        </div>
        <div className="practice-roster">
          {species.map((item, index) => {
            const variants = cards.filter((card) => card.speciesId === item.speciesId)
            const selected = team.find((id) => cardsById.get(id)!.speciesId === item.speciesId)
            const id = selected ?? preferences[item.speciesId] ?? variants[0].id
            const card = cardsById.get(id)!
            const name = item.names[locale]
            return (
              <article
                key={item.speciesId}
                className={'practice-species' + (selected ? ' is-selected' : '')}
              >
                <div className="practice-species-heading">
                  <h3>{name}</h3>
                  <span>
                    {selected ? String(team.indexOf(selected) + 1).padStart(2, '0') : '—'}
                  </span>
                </div>
                <p className="practice-types">
                  {item.types.map((type) => t('pokemonTypes.' + type)).join(' / ')}
                </p>
                <PracticeCard id={id} priority={index < 4} />
                <label htmlFor={'variant-' + item.speciesId} className="practice-label">
                  {t('practice.artwork', { name })}
                </label>
                <select
                  id={'variant-' + item.speciesId}
                  value={id}
                  onChange={(event) => {
                    const next = event.target.value
                    setPreferences((previous) => ({ ...previous, [item.speciesId]: next }))
                    if (selected)
                      onTeamChange(team.map((current) => (current === selected ? next : current)))
                  }}
                >
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.id} ·{' '}
                      {t('rarities.' + variant.rarity, { defaultValue: variant.rarity })}
                    </option>
                  ))}
                </select>
                <dl className="practice-stats">
                  {(
                    [
                      ['hp', card.maxHp],
                      ['attack', card.attack],
                      ['defense', card.defense],
                      ['speed', card.speed],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt>{t('practice.' + label)}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="practice-roster-actions">
                  <Button
                    variant={selected ? 'secondary' : 'primary'}
                    disabled={!selected && team.length === 6}
                    aria-label={t(selected ? 'practice.removeNamed' : 'practice.addNamed', {
                      name,
                    })}
                    onClick={() =>
                      onTeamChange(
                        selected ? team.filter((current) => current !== selected) : [...team, id],
                      )
                    }
                  >
                    {t(selected ? 'practice.remove' : 'practice.add')}
                  </Button>
                  {selected && (
                    <button
                      type="button"
                      className="practice-text-button"
                      disabled={team[0] === selected}
                      onClick={() =>
                        onTeamChange([selected, ...team.filter((current) => current !== selected)])
                      }
                    >
                      {t(team[0] === selected ? 'practice.lead' : 'practice.makeLead')}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
        <div className="practice-bottom-start">
          <p>{t('practice.fullHint')}</p>
          <Button disabled={team.length !== 6} onClick={onStart}>
            {t('practice.start')} · {team.length}/6
          </Button>
        </div>
      </section>
    </>
  )
}
