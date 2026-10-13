import { useTranslation } from 'react-i18next'
import type { PracticeSession } from '../../battle/practice'
import { describe } from './event-description'
export function BattleLog({ rounds }: { rounds: PracticeSession['rounds'] }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'es'
  return (
    <section className="practice-log" aria-labelledby="practice-log-heading">
      <h2 id="practice-log-heading">{t('practice.logTitle')}</h2>
      {rounds.length === 0 ? (
        <p>{t('practice.logEmpty')}</p>
      ) : (
        [...rounds].reverse().map((round, index) => (
          <details key={round.turn} open={index === 0 ? true : undefined}>
            <summary>{t('practice.turn', { turn: round.turn })}</summary>
            <ul>
              {round.events.map((event, i) => {
                const text = describe(event, t, locale)
                return text ? <li key={i}>{text}</li> : null
              })}
            </ul>
          </details>
        ))
      )}
    </section>
  )
}
