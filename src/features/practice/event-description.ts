import type { BattleEvent } from '../../battle/engine-types'
import type { Locale } from '../../i18n'
import type { TFunction } from 'i18next'
import { fighterName, moveName, resultKey } from './practice-data'
export function describe(event: BattleEvent, t: TFunction, locale: Locale): string | null {
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
      return t(event.effect === 'heal' ? 'supports.logHeal' : 'supports.log', {
        name: who(event.side, event.actorId),
        card: t('supports.names.' + event.supportId, { defaultValue: event.supportId }),
        effect: t('supports.effects.' + event.effect),
        amount: event.healed,
      })
    case 'expired':
      return t('supports.expired', {
        name: who(event.side, event.targetId),
        effect: t('supports.effects.' + event.effect),
      })
  }
}
