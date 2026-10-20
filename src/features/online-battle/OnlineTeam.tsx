import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getPlayableCard } from '../../battle/playable-roster'
import { CollectionCard } from '../collection/CollectionCard'
import { cardLabel } from '../collection/card-data'
import { Button } from '../../components/ui/Button'
export function OnlineTeam({
  owned,
  disabled,
  start,
}: {
  owned: string[]
  disabled: boolean
  start: (ids: string[]) => void
}) {
  const { t, i18n } = useTranslation(),
    locale = i18n.language === 'en' ? 'en' : 'es'
  const [team, setTeam] = useState(() => {
    const species = new Set<number>()
    return owned
      .filter((id) => {
        const c = getPlayableCard(id)
        if (!c || species.has(c.speciesId)) return false
        species.add(c.speciesId)
        return true
      })
      .slice(0, 6)
  })
  function choose(id: string) {
    if (team.includes(id)) {
      setTeam(team.filter((x) => x !== id))
      return
    }
    const species = getPlayableCard(id)!.speciesId,
      old = team.find((x) => getPlayableCard(x)!.speciesId === species)
    if (old) setTeam(team.map((x) => (x === old ? id : x)))
    else if (team.length < 6) setTeam([...team, id])
  }
  return (
    <section className="online-team" aria-labelledby="online-team-title">
      <div className="online-team-heading">
        <div>
          <h2 id="online-team-title">{t('online.teamTitle')}</h2>
          <p>{t('online.teamHelp')}</p>
        </div>
        <strong aria-live="polite">{team.length}/6</strong>
      </div>
      <ol className="online-team-order">
        {team.map((id, i) => (
          <li key={id}>
            <span>
              {i + 1}. {cardLabel(id, locale)}
            </span>
            {i > 0 && (
              <button
                disabled={disabled}
                onClick={() => setTeam([id, ...team.filter((x) => x !== id)])}
                aria-label={t('online.leadNamed', { name: cardLabel(id, locale) })}
              >
                {t('online.lead')}
              </button>
            )}
          </li>
        ))}
      </ol>
      <div className="online-team-grid">
        {owned.map((id) => {
          const selected = team.includes(id),
            same = team.some(
              (x) => getPlayableCard(x)!.speciesId === getPlayableCard(id)!.speciesId,
            )
          return (
            <article className={'online-choice' + (selected ? ' selected' : '')} key={id}>
              <CollectionCard id={id} />
              <button
                type="button"
                aria-pressed={selected}
                disabled={disabled || (!selected && !same && team.length === 6)}
                onClick={() => choose(id)}
                aria-label={t(selected ? 'online.removeNamed' : 'online.selectNamed', {
                  name: cardLabel(id, locale),
                  id,
                })}
              >
                {t(selected ? 'online.selected' : 'online.select')}
              </button>
            </article>
          )
        })}
      </div>
      <Button disabled={disabled || team.length !== 6} onClick={() => start(team)}>
        {t('online.start')}
      </Button>
    </section>
  )
}
