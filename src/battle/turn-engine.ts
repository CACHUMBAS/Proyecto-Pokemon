import { activeFighter, checkTransition, requireValid, validateAction } from './battle-state.ts'
import {
  switchFighter,
  applySupport,
  executeMove,
  closeTurnEffects,
  knockoutResult,
  finish,
} from './battle-effects.ts'
import type {
  BattleAction,
  BattleState,
  BattleTransition,
  BattleEvent,
  Side,
} from './engine-types.ts'

function speed(state: BattleState, side: Side): number {
  const f = activeFighter(state, side)
  return f.status === 'paralysis' ? Math.max(1, Math.floor(f.speed / 2)) : f.speed
}

/**
 * Resolve a pair of already collected actions against an internal valid snapshot.
 * The caller owns private confirmation, deadlines, request IDs and atomic persistence.
 * tieBreak is an injected uniform bit: 0/1 names the side acting first in a speed tie.
 */
export function resolveTurn(
  state: BattleState,
  actions: readonly [BattleAction, BattleAction],
  expectedVersion: number,
  tieBreak?: Side,
): BattleTransition {
  checkTransition(state, 'selection', expectedVersion)
  requireValid(Array.isArray(actions) && actions.length === 2, 'action pair')
  requireValid(tieBreak === undefined || tieBreak === 0 || tieBreak === 1, 'tie break')
  for (const side of [0, 1] as const) validateAction(state, side, actions[side])
  const next = structuredClone(state)
  next.version += 1
  const events: BattleEvent[] = []
  for (const side of [0, 1] as const) {
    const action = actions[side]
    if (action.kind === 'switch') switchFighter(next, side, action.targetId, false, events)
  }
  for (const side of [0, 1] as const) {
    const action = actions[side]
    if (action.kind === 'support') applySupport(next, side, action.supportId, events)
  }
  const order = ([0, 1] as Side[]).filter((side) => actions[side].kind === 'move')
  let consumedBit: Side | null = null
  if (order.length === 2) {
    const a = speed(next, 0)
    const b = speed(next, 1)
    if (a === b) {
      requireValid(tieBreak !== undefined, 'missing tie break')
      consumedBit = tieBreak
      if (tieBreak === 1) order.reverse()
    } else if (b > a) order.reverse()
  }
  events.push({ kind: 'order', sides: [...order], tieBreak: consumedBit })
  for (const side of order) {
    const action = actions[side]
    if (action.kind !== 'move') continue
    const actor = next.sides[side].fighters.find((f) => f.id === action.actorId)!
    const move = actor.moves.find((m) => m.id === action.moveId)!
    executeMove(next, side, actor.id, move, events)
    const result = knockoutResult(next)
    if (result) {
      finish(next, result, events)
      return { state: next, events }
    }
  }
  closeTurnEffects(next, events)
  const result = knockoutResult(next)
  if (result) finish(next, result, events)
  else if (next.turn === 60) finish(next, { kind: 'draw', reason: 'turn-limit' }, events)
  else if (([0, 1] as const).some((side) => activeFighter(next, side).hp === 0))
    next.phase = 'replacement'
  else next.turn += 1
  return { state: next, events }
}

/** null defaults an affected side to its first living reserve; the caller decides when. */
export function resolveReplacements(
  state: BattleState,
  choices: readonly [string | null, string | null],
  expectedVersion: number,
): BattleTransition {
  checkTransition(state, 'replacement', expectedVersion)
  requireValid(
    state.turn < 60 && Array.isArray(choices) && choices.length === 2,
    'replacement pair',
  )
  const targets: [string | null, string | null] = [null, null]
  for (const side of [0, 1] as const) {
    const team = state.sides[side]
    if (activeFighter(state, side).hp > 0) {
      requireValid(choices[side] === null, 'unnecessary replacement')
      continue
    }
    const target =
      choices[side] === null
        ? team.fighters.find((f) => f.hp > 0)
        : team.fighters.find((f) => f.id === choices[side] && f.hp > 0)
    requireValid(target, 'replacement target')
    targets[side] = target.id
  }
  requireValid(
    targets.some((t) => t !== null),
    'replacement phase without fainted active',
  )
  const next = structuredClone(state)
  const events: BattleEvent[] = []
  for (const side of [0, 1] as const) {
    const target = targets[side]
    if (target !== null) switchFighter(next, side, target, true, events)
  }
  next.phase = 'selection'
  next.turn += 1
  next.version += 1
  return { state: next, events }
}
