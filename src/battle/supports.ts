import { activeFighter, requireValid, validateAction } from './battle-state.ts'
import type { BattleState, Side, SupportDefinition } from './engine-types.ts'

// Explicit Lumemon adaptations, never inferred from TCG rules or card names.
export const SUPPORT_DATA_VERSION = 'lumemon-supports-v1'
const supports: readonly SupportDefinition[] = [
  { id: 'base1-90', effect: 'heal' },
  { id: 'base1-82', effect: 'cleanse' },
  { id: 'base1-80', effect: 'barrier' },
  { id: 'base1-96', effect: 'boost' },
]
export function listPlayableSupports(): SupportDefinition[] {
  return structuredClone(supports) as SupportDefinition[]
}
export function getPlayableSupport(id: string): SupportDefinition | undefined {
  const support = supports.find((s) => s.id === id)
  return support ? { ...support } : undefined
}
export function makePlayableSupports(ids: readonly string[]): SupportDefinition[] {
  requireValid(Array.isArray(ids) && ids.length <= 3, 'up to three support cards')
  const selected = Array.from(ids, (id) => {
    const support = getPlayableSupport(id)
    requireValid(support, 'card not enabled as support: ' + id)
    return support
  })
  requireValid(
    new Set(selected.map((s) => s.effect)).size === selected.length,
    'distinct support effects',
  )
  return selected
}

/** The engine remains the authority; reasons explain a rejected action to the player. */
export function supportUnavailable(state: BattleState, side: Side, id: string): string | null {
  const actor = activeFighter(state, side)
  try {
    validateAction(state, side, { kind: 'support', actorId: actor.id, supportId: id })
    return null
  } catch {
    const support = state.sides[side].supports.find((s) => s.id === id)
    if (support?.used) return 'used'
    if (state.phase !== 'selection' || actor.hp === 0 || !support) return 'unavailable'
    if (support.effect === 'heal' && actor.hp === actor.maxHp) return 'fullHp'
    if (support.effect === 'cleanse' && !actor.status) return 'noStatus'
    return 'alreadyActive'
  }
}
