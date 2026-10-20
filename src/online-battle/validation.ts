import { createBattle } from '../battle/battle-state.ts'
import { getPlayableCard } from '../battle/playable-roster.ts'
import { BattleFailure, object, integer, uuid, parsePending } from './protocol.ts'
import type { OnlineView } from './protocol.ts'
function valid(condition: unknown): asserts condition {
  if (!condition) throw new BattleFailure('invalid_data')
}
export function parseView(value: unknown, userId: string): OnlineView {
  try {
    valid(object(value) && value.user_id === userId && value.version === 'lumemon-online-v1')
    valid(
      integer(value.coins) &&
        value.coins <= 1e9 &&
        Array.isArray(value.owned) &&
        value.owned.length <= 48,
    )
    const ids = new Set<string>()
    for (const c of value.owned) {
      valid(
        object(c) &&
          typeof c.card_id === 'string' &&
          getPlayableCard(c.card_id) &&
          integer(c.quantity) &&
          c.quantity > 0 &&
          c.quantity <= 1e6 &&
          !ids.has(c.card_id),
      )
      ids.add(c.card_id)
    }
    if (value.receipt !== null) parsePending(value.receipt)
    if (value.match !== null) {
      const m = value.match
      valid(object(m) && uuid(m.id) && integer(m.revision) && m.revision <= 1000)
      valid(
        ['active', 'finished', 'abandoned'].includes(String(m.status)) &&
          (m.reward === 0 || m.reward === 50),
      )
      valid(m.reward === 0 || m.status === 'finished')
      const s = m.session
      valid(
        object(s) &&
          s.opponentId === 'rookie' &&
          !Object.hasOwn(s, 'botAction') &&
          !Object.hasOwn(s, 'tutorial'),
      )
      const b = s.battle
      valid(
        object(b) &&
          b.battleId === m.id &&
          typeof b.dataVersion === 'string' &&
          integer(b.version) &&
          integer(b.turn) &&
          b.turn >= 1 &&
          b.turn <= 61,
      )
      valid(
        ['selection', 'replacement', 'finished'].includes(String(b.phase)) &&
          typeof b.rulesetVersion === 'string' &&
          typeof b.damageRulesetVersion === 'string',
      )
      valid(Array.isArray(b.sides) && b.sides.length === 2)
      for (const side of b.sides) {
        valid(
          object(side) &&
            Array.isArray(side.fighters) &&
            Array.isArray(side.supports) &&
            side.supports.length === 0 &&
            integer(side.active) &&
            side.active < 6,
        )
        for (const f of side.fighters) {
          valid(
            object(f) &&
              integer(f.hp) &&
              typeof f.maxHp === 'number' &&
              f.hp <= f.maxHp &&
              object(f.readyOn),
          )
          valid(
            f.status === null ||
              ['poison', 'burn', 'paralysis', 'sleep', 'freeze'].includes(String(f.status)),
          )
          valid(f.boost === null && f.barrierUntil === null)
          valid(Object.values(f.readyOn).every(integer))
        }
      }
      createBattle({
        battleId: m.id,
        dataVersion: b.dataVersion,
        teams: b.sides as unknown as Parameters<typeof createBattle>[0]['teams'],
      })
      if (b.phase === 'finished') {
        valid(object(b.result))
        valid(
          (b.result.kind === 'win' &&
            (b.result.winner === 0 || b.result.winner === 1) &&
            b.result.reason === 'knockout') ||
            (b.result.kind === 'draw' &&
              ['double-knockout', 'turn-limit'].includes(String(b.result.reason))),
        )
      } else valid(b.result === null)
      valid(m.status !== 'finished' || b.phase === 'finished')
      valid(m.status !== 'active' || b.phase !== 'finished')
      valid(Array.isArray(s.rounds) && s.rounds.length <= 61)
      for (const round of s.rounds) {
        valid(
          object(round) &&
            integer(round.turn) &&
            Array.isArray(round.events) &&
            round.events.length <= 100,
        )
        for (const event of round.events)
          valid(
            object(event) &&
              [
                'switch',
                'support',
                'order',
                'move',
                'blocked',
                'damage',
                'status',
                'faint',
                'expired',
                'result',
              ].includes(String(event.kind)),
          )
      }
    }
    return value as unknown as OnlineView
  } catch {
    throw new BattleFailure('invalid_data')
  }
}
