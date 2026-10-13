import { calculateDamage } from './damage.ts'
import { getTypeEffectiveness } from './type-chart.ts'
import { activeFighter } from './battle-state.ts'
import type {
  BattleState,
  BattleEvent,
  BattleMove,
  BattleResult,
  Side,
  Status,
  Fighter,
} from './engine-types.ts'

export function percentage(maxHp: number, percent: number): number {
  return Math.max(1, Number((BigInt(maxHp) * BigInt(percent)) / 100n))
}
function clearStatus(f: Fighter, side: Side, events: BattleEvent[]): void {
  if (f.status)
    events.push({ kind: 'status', side, targetId: f.id, status: f.status, outcome: 'cleared' })
  f.status = null
}
function faint(f: Fighter, side: Side, events: BattleEvent[]): void {
  if (f.hp !== 0) return
  clearStatus(f, side, events)
  f.boost = null
  f.barrierUntil = null
  events.push({ kind: 'faint', side, targetId: f.id })
}
export function switchFighter(
  state: BattleState,
  side: Side,
  targetId: string,
  forced: boolean,
  events: BattleEvent[],
): void {
  const team = state.sides[side]
  const outgoing = activeFighter(state, side)
  if (outgoing.status === 'sleep' || outgoing.status === 'freeze')
    clearStatus(outgoing, side, events)
  outgoing.boost = null
  outgoing.barrierUntil = null
  team.active = team.fighters.findIndex((f) => f.id === targetId)
  events.push({ kind: 'switch', side, from: outgoing.id, to: targetId, forced })
}
export function applySupport(
  state: BattleState,
  side: Side,
  supportId: string,
  events: BattleEvent[],
): void {
  // The resolver validates both actions before reaching this internal helper.
  const support = state.sides[side].supports.find((s) => s.id === supportId)!
  const actor = activeFighter(state, side)
  let healed = 0
  switch (support.effect) {
    case 'heal':
      healed = Math.min(actor.maxHp - actor.hp, percentage(actor.maxHp, 30))
      actor.hp += healed
      break
    case 'cleanse':
      clearStatus(actor, side, events)
      break
    case 'barrier':
      actor.barrierUntil = state.turn + 1
      break
    case 'boost':
      actor.boost = { charges: 2, expiresAfter: state.turn + 2 }
      break
  }
  support.used = true
  events.push({
    kind: 'support',
    side,
    actorId: actor.id,
    supportId,
    effect: support.effect,
    healed,
  })
}
function statusImmune(target: Fighter, status: Status): boolean {
  switch (status) {
    case 'poison':
      return target.types.includes('poison') || target.types.includes('steel')
    case 'burn':
      return target.types.includes('fire')
    case 'paralysis':
      return target.types.includes('electric')
    case 'freeze':
      return target.types.includes('ice')
    case 'sleep':
      return false
  }
}
export function executeMove(
  state: BattleState,
  side: Side,
  actorId: string,
  move: BattleMove,
  events: BattleEvent[],
): void {
  const actor = state.sides[side].fighters.find((f) => f.id === actorId)!
  const other: Side = side === 0 ? 1 : 0
  const target = activeFighter(state, other)
  if (actor.hp === 0 || target.hp === 0) {
    events.push({
      kind: 'blocked',
      side,
      actorId,
      reason: actor.hp === 0 ? 'knockout' : 'target-knockout',
    })
    return
  }
  if (actor.status === 'sleep' || actor.status === 'freeze') {
    events.push({ kind: 'blocked', side, actorId, reason: actor.status })
    clearStatus(actor, side, events)
    return
  }
  actor.readyOn[move.id] = state.turn + move.cooldown + 1
  events.push({ kind: 'move', side, actorId, moveId: move.id, readyOn: actor.readyOn[move.id] })
  if (move.kind === 'status') {
    const outcome = target.status
      ? 'occupied'
      : getTypeEffectiveness(move.type, target.types) === 0 || statusImmune(target, move.status)
        ? 'immune'
        : 'applied'
    if (outcome === 'applied') target.status = move.status
    events.push({ kind: 'status', side: other, targetId: target.id, status: move.status, outcome })
    return
  }
  const result = calculateDamage({
    power: move.power,
    moveType: move.type,
    attack: actor.attack,
    defense: target.defense,
    attackerTypes: actor.types,
    defenderTypes: target.types,
    defenderHp: target.hp,
    burned: actor.status === 'burn',
    boosted: actor.boost !== null,
    shielded: target.barrierUntil !== null,
  })
  if (actor.boost) {
    actor.boost.charges -= 1
    if (actor.boost.charges === 0) {
      actor.boost = null
      events.push({ kind: 'expired', side, targetId: actor.id, effect: 'boost' })
    }
  }
  target.hp = result.remainingHp
  events.push({
    kind: 'damage',
    side: other,
    targetId: target.id,
    source: 'move',
    amount: result.damage,
    remainingHp: target.hp,
  })
  if (result.damage > 0 && move.type === 'fire' && target.status === 'freeze')
    clearStatus(target, other, events)
  faint(target, other, events)
}
export function closeTurnEffects(state: BattleState, events: BattleEvent[]): void {
  // Compute both residual amounts from the same state, then apply both before checking victory.
  const ticks = ([0, 1] as const).map((side) => {
    const target = activeFighter(state, side)
    const source = target.status
    return target.hp > 0 && (source === 'poison' || source === 'burn')
      ? {
          side,
          target,
          source,
          amount: Math.min(target.hp, percentage(target.maxHp, source === 'poison' ? 8 : 5)),
        }
      : null
  })
  for (const tick of ticks) {
    if (!tick) continue
    const { side, target, source, amount } = tick
    target.hp -= amount
    events.push({
      kind: 'damage',
      side,
      targetId: target.id,
      source,
      amount,
      remainingHp: target.hp,
    })
    faint(target, side, events)
  }
  for (const side of [0, 1] as const) {
    for (const f of state.sides[side].fighters) {
      if (f.barrierUntil !== null && f.barrierUntil <= state.turn) {
        f.barrierUntil = null
        events.push({ kind: 'expired', side, targetId: f.id, effect: 'barrier' })
      }
      if (f.boost && f.boost.expiresAfter <= state.turn) {
        f.boost = null
        events.push({ kind: 'expired', side, targetId: f.id, effect: 'boost' })
      }
    }
  }
}
export function knockoutResult(state: BattleState): BattleResult | null {
  const alive = state.sides.map((team) => team.fighters.some((f) => f.hp > 0))
  if (!alive[0] && !alive[1]) return { kind: 'draw', reason: 'double-knockout' }
  if (!alive[0] || !alive[1]) return { kind: 'win', winner: alive[0] ? 0 : 1, reason: 'knockout' }
  return null
}
export function finish(state: BattleState, result: BattleResult, events: BattleEvent[]): void {
  state.result = result
  state.phase = 'finished'
  events.push({ kind: 'result', result: { ...result } })
}
