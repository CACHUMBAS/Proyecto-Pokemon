import { DAMAGE_RULESET_VERSION } from './damage.ts'
import { assertPokemonTypes } from './type-chart.ts'
import { BATTLE_RULESET_VERSION } from './engine-types.ts'
import type {
  BattleSetup,
  BattleState,
  BattleAction,
  Side,
  Fighter,
  BattleMove,
  TeamDefinition,
} from './engine-types.ts'

export function requireValid(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Invalid ' + message)
}
function isArray(value: unknown): boolean {
  return Array.isArray(value)
}
function record(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !isArray(value)
}
function identifier(value: unknown): boolean {
  return (
    typeof value === 'string' &&
    /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/.test(value) &&
    !Object.hasOwn(Object.prototype, value)
  )
}
function positive(value: unknown): boolean {
  return Number.isSafeInteger(value) && (value as number) > 0
}
const STATUSES = ['poison', 'burn', 'paralysis', 'sleep', 'freeze']
const SUPPORTS = ['heal', 'cleanse', 'barrier', 'boost']

function checkMove(move: BattleMove): void {
  requireValid(record(move) && identifier(move.id), 'move')
  try {
    assertPokemonTypes([move.type])
  } catch {
    throw new Error('Invalid move type')
  }
  if (move.kind === 'damage') {
    requireValid(
      (move.power === 40 && move.cooldown === 0) || (move.power === 60 && move.cooldown === 1),
      'damage profile',
    )
  } else {
    requireValid(
      move.kind === 'status' &&
        move.power === 0 &&
        move.cooldown === 2 &&
        STATUSES.includes(move.status),
      'status profile',
    )
  }
}

function checkTeam(team: TeamDefinition): void {
  requireValid(record(team) && isArray(team.fighters) && team.fighters.length === 6, 'team')
  const ids = new Set<string>()
  const species = new Set<number>()
  for (const f of team.fighters) {
    requireValid(record(f) && identifier(f.id) && !ids.has(f.id), 'fighter ID')
    requireValid(positive(f.speciesId) && !species.has(f.speciesId), 'species ID')
    ids.add(f.id)
    species.add(f.speciesId)
    for (const field of ['maxHp', 'attack', 'defense', 'speed'] as const)
      requireValid(positive(f[field]), field)
    try {
      assertPokemonTypes(f.types)
    } catch {
      throw new Error('Invalid fighter types')
    }
    requireValid(isArray(f.moves) && f.moves.length >= 1 && f.moves.length <= 4, 'moves')
    const moveIds = new Set<string>()
    for (const move of f.moves) {
      checkMove(move)
      requireValid(!moveIds.has(move.id), 'duplicate move')
      moveIds.add(move.id)
    }
    requireValid(
      f.moves.some((m) => m.kind === 'damage' && m.power === 40 && m.cooldown === 0),
      'missing basic move',
    )
  }
  requireValid(isArray(team.supports) && team.supports.length <= 3, 'supports')
  const supportIds = new Set<string>()
  const effects = new Set<string>()
  for (const s of team.supports) {
    requireValid(record(s) && identifier(s.id) && !supportIds.has(s.id), 'support ID')
    requireValid(SUPPORTS.includes(s.effect) && !effects.has(s.effect), 'support effect')
    supportIds.add(s.id)
    effects.add(s.effect)
  }
}

/** Inputs are explicit mapped battle data, not catalog records or proof of ownership. */
export function createBattle(setup: BattleSetup): BattleState {
  requireValid(
    record(setup) && identifier(setup.battleId) && identifier(setup.dataVersion),
    'battle identity',
  )
  requireValid(isArray(setup.teams) && setup.teams.length === 2, 'two teams')
  for (const team of setup.teams) checkTeam(team)
  const makeSide = (team: TeamDefinition) => ({
    active: 0,
    fighters: team.fighters.map((f) => ({
      ...structuredClone(f),
      hp: f.maxHp,
      status: null,
      barrierUntil: null,
      boost: null,
      readyOn: Object.fromEntries(f.moves.map((m) => [m.id, 1])),
    })),
    supports: team.supports.map((s) => ({ ...s, used: false })),
  })
  return {
    battleId: setup.battleId,
    dataVersion: setup.dataVersion,
    rulesetVersion: BATTLE_RULESET_VERSION,
    damageRulesetVersion: DAMAGE_RULESET_VERSION,
    version: 1,
    turn: 1,
    phase: 'selection',
    sides: [makeSide(setup.teams[0]), makeSide(setup.teams[1])],
    result: null,
  }
}

export function activeFighter(state: BattleState, side: Side): Fighter {
  return state.sides[side].fighters[state.sides[side].active]
}

/** State must come from this module/engine; this is not an untrusted snapshot decoder. */
export function checkTransition(
  state: BattleState,
  phase: BattleState['phase'],
  version: number,
): void {
  requireValid(state.phase === phase && state.result === null, 'phase')
  requireValid(
    state.rulesetVersion === BATTLE_RULESET_VERSION &&
      state.damageRulesetVersion === DAMAGE_RULESET_VERSION,
    'ruleset',
  )
  requireValid(
    Number.isSafeInteger(version) &&
      version === state.version &&
      version >= 1 &&
      version < Number.MAX_SAFE_INTEGER,
    'version',
  )
  requireValid(Number.isSafeInteger(state.turn) && state.turn >= 1 && state.turn <= 60, 'turn')
}

export function validateAction(state: BattleState, side: Side, action: BattleAction): void {
  checkTransition(state, 'selection', state.version)
  requireValid(side === 0 || side === 1, 'side')
  requireValid(record(action), 'action')
  const actor = activeFighter(state, side)
  requireValid(actor.hp > 0, 'active fighter')
  if (action.kind === 'pass') return
  requireValid(action.actorId === actor.id, 'actor')
  switch (action.kind) {
    case 'move': {
      const move = actor.moves.find((m) => m.id === action.moveId)
      requireValid(move && actor.readyOn[move.id] <= state.turn, 'move or cooldown')
      break
    }
    case 'switch':
      requireValid(
        state.sides[side].fighters.some(
          (f) => f.id === action.targetId && f.id !== actor.id && f.hp > 0,
        ),
        'switch',
      )
      break
    case 'support': {
      const s = state.sides[side].supports.find((s) => s.id === action.supportId)
      requireValid(s && !s.used, 'support')
      if (s.effect === 'heal') requireValid(actor.hp < actor.maxHp, 'heal at full HP')
      if (s.effect === 'cleanse') requireValid(actor.status !== null, 'cleanse without status')
      if (s.effect === 'barrier')
        requireValid(actor.barrierUntil === null, 'barrier already active')
      if (s.effect === 'boost') requireValid(actor.boost === null, 'boost already active')
      break
    }
    default:
      throw new Error('Invalid action kind')
  }
}
