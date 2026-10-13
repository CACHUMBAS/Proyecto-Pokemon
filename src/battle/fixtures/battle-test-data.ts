// Synthetic fixtures only: these are not profiles or verified moves of real cards.
import type {
  BattleSetup,
  BattleState,
  BattleAction,
  FighterDefinition,
  Side,
  Status,
} from '../engine-types.ts'
import { createBattle } from '../battle-state.ts'
export const PASS = { kind: 'pass' } as const
export function fighter(id: string, speciesId: number): FighterDefinition {
  return {
    id,
    speciesId,
    types: ['normal'],
    maxHp: 204,
    attack: 90,
    defense: 75,
    speed: 100,
    moves: [
      { id: 'basic', kind: 'damage', type: 'normal', power: 40, cooldown: 0 },
      { id: 'strong', kind: 'damage', type: 'normal', power: 60, cooldown: 1 },
      { id: 'status', kind: 'status', type: 'normal', power: 0, cooldown: 2, status: 'poison' },
    ],
  }
}
export function setup(): BattleSetup {
  return {
    battleId: 'synthetic-battle',
    dataVersion: 'test-only-v1',
    teams: [0, 1].map((side) => ({
      fighters: Array.from({ length: 6 }, (_, i) => fighter('s' + side + '-' + i, i + 1)),
      supports: [
        { id: 'heal', effect: 'heal' },
        { id: 'cleanse', effect: 'cleanse' },
        { id: 'boost', effect: 'boost' },
      ],
    })) as unknown as BattleSetup['teams'],
  }
}
export function battle(): BattleState {
  return createBattle(setup())
}
export function move(state: BattleState, side: Side, moveId = 'basic'): BattleAction {
  return { kind: 'move', actorId: state.sides[side].fighters[state.sides[side].active].id, moveId }
}
export function support(state: BattleState, side: Side, supportId: string): BattleAction {
  return {
    kind: 'support',
    actorId: state.sides[side].fighters[state.sides[side].active].id,
    supportId,
  }
}
export function statusMove(state: BattleState, side: Side, status: Status, type = 'normal'): void {
  const actor = state.sides[side].fighters[0]
  Object.assign(actor, {
    moves: actor.moves.map((m) => (m.id === 'status' ? { ...m, type, status } : m)),
  })
}
export function lastAlive(state: BattleState): void {
  for (const team of state.sides) for (const fighter of team.fighters.slice(1)) fighter.hp = 0
}
