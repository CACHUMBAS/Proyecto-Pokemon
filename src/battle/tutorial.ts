import { activeFighter } from './battle-state.ts'
import type { BattleAction, BattleEvent, BattleState } from './engine-types.ts'
export type TutorialStep = 'welcome' | 'attack' | 'types' | 'switch' | 'status' | 'complete'
export const TUTORIAL_PLAYER = [
  'base1-58',
  'base1-44',
  'base1-46',
  'base1-63',
  'base1-68',
  'base2-54',
] as const
/** Only action selection is guided. Stats, opponent decisions and resolution use the normal engine. */
export function tutorialAction(
  battle: BattleState,
  step: TutorialStep | null,
): BattleAction | null {
  if (battle.phase !== 'selection') return null
  const actor = activeFighter(battle, 0)
  if (step === 'switch') {
    const target = battle.sides[0].fighters.find(
      (f) => f.speciesId === 39 && f.hp > 0 && f.id !== actor.id,
    )
    return target ? { kind: 'switch', actorId: actor.id, targetId: target.id } : null
  }
  const move = actor.moves.find(
    (m) =>
      m.id === (step === 'attack' ? 'pokeapi-85' : step === 'status' ? 'pokeapi-47' : '') &&
      (actor.readyOn[m.id] ?? 1) <= battle.turn,
  )
  return move ? { kind: 'move', actorId: actor.id, moveId: move.id } : null
}
export function matchesAction(allowed: BattleAction | null, actual: BattleAction): boolean {
  if (!allowed || allowed.kind !== actual.kind) return false
  switch (allowed.kind) {
    case 'move':
      return (
        actual.kind === 'move' &&
        actual.actorId === allowed.actorId &&
        actual.moveId === allowed.moveId
      )
    case 'switch':
      return (
        actual.kind === 'switch' &&
        actual.actorId === allowed.actorId &&
        actual.targetId === allowed.targetId
      )
    case 'support':
      return (
        actual.kind === 'support' &&
        actual.actorId === allowed.actorId &&
        actual.supportId === allowed.supportId
      )
    case 'pass':
      return true
  }
}
export function advanceTutorial(
  step: TutorialStep | null,
  battle: BattleState,
  events: readonly BattleEvent[],
): TutorialStep | null {
  const expected = tutorialAction(battle, step)
  if (!expected) return step
  if (
    step === 'attack' &&
    expected.kind === 'move' &&
    events.some(
      (e) =>
        e.kind === 'move' &&
        e.side === 0 &&
        e.actorId === expected.actorId &&
        e.moveId === expected.moveId,
    )
  )
    return 'types'
  if (
    step === 'switch' &&
    expected.kind === 'switch' &&
    events.some((e) => e.kind === 'switch' && e.side === 0 && e.to === expected.targetId)
  )
    return 'status'
  if (
    step === 'status' &&
    events.some(
      (e) =>
        e.kind === 'status' &&
        e.side === 1 &&
        e.targetId === activeFighter(battle, 1).id &&
        e.status === 'sleep' &&
        e.outcome === 'applied',
    )
  )
    return 'complete'
  return step
}
