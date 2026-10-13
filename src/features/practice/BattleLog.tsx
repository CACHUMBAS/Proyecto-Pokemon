import { useTranslation } from 'react-i18next'
import type { BattleEvent } from '../../battle/engine-types'
import type { PracticeSession } from '../../battle/practice'
import type { Locale } from '../../i18n'
import type { TFunction } from 'i18next'
import { fighterName, moveName, resultKey } from './practice-data'

function describe(event: BattleEvent, t: TFunction, locale: Locale): string | null {
  const who = (side: 0 | 1, id: string) =>
    fighterName(id, locale) + ' · ' + t(side === 0 ? 'practice.you' : 'practice.bot')
  switch (event.kind) {
    case 'order':
      return event.tieBreak === null ? null : t('practice.log.tie')
    case 'move':
      return t('practice.log.move', {
        name: who(event.side, event.actorId),
        move: moveName(event.moveId, locale),
      })
    case 'switch':
      return t('practice.log.switch', { name: who(event.side, event.to) })
    case 'damage':
      return t('practice.log.damage', {
        name: who(event.side, event.targetId),
        amount: event.amount,
        hp: event.remainingHp,
        source: t('practice.damageSource.' + event.source),
      })
    case 'status':
      return t('practice.log.' + event.outcome, {
        name: who(event.side, event.targetId),
        status: t('practice.status.' + event.status),
      })
    case 'faint':
      return t('practice.log.faint', { name: who(event.side, event.targetId) })
    case 'blocked':
      return t('practice.log.blocked', {
        name: who(event.side, event.actorId),
        reason: t('practice.blocked.' + event.reason),
      })
    case 'result':
      return t('practice.' + resultKey(event.result))
    case 'support':
      return t('practice.log.support', { name: who(event.side, event.actorId) })
    case 'expired':
      return t('practice.log.expired', { name: who(event.side, event.targetId) })
  }
}
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
