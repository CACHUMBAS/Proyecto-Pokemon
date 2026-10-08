import type { CardRecord } from '../catalog/types.ts'

export const POKEMON_TEAM_SIZE = 6

export interface PokemonTeamMember {
  readonly cardId: string
  readonly speciesId: number
}

type SlotIssue = { slot: number; cardId: string }
export type PokemonTeamIssue =
  | { code: 'team-size'; expected: number; actual: number }
  | (SlotIssue & { code: 'unknown-card' | 'not-pokemon' | 'unresolved-species' })
  | (SlotIssue & { code: 'duplicate-card'; firstSlot: number })
  | (SlotIssue & { code: 'unknown-species'; speciesId: number })
  | (SlotIssue & { code: 'duplicate-species'; firstSlot: number; speciesId: number })

export type PokemonTeamValidation =
  | { valid: true; members: readonly PokemonTeamMember[] }
  | { valid: false; issues: readonly PokemonTeamIssue[] }

/**
 * Checks team composition against a trusted catalog; slots are zero-based.
 * Does not establish ownership or battle readiness (stats, moves and supports).
 * External payloads must be shape-checked before calling this typed domain function.
 */
export function validatePokemonTeam(
  cardIds: readonly string[],
  catalog: ReadonlyMap<string, CardRecord>,
  knownSpecies: ReadonlySet<number>,
): PokemonTeamValidation {
  const issues: PokemonTeamIssue[] = []
  const members: PokemonTeamMember[] = []
  const seenCards = new Map<string, number>()
  const seenSpecies = new Map<number, number>()

  if (cardIds.length !== POKEMON_TEAM_SIZE) {
    issues.push({ code: 'team-size', expected: POKEMON_TEAM_SIZE, actual: cardIds.length })
  }

  // Iterate every position, including empty slots in a sparse array.
  for (const [slot, cardId] of cardIds.entries()) {
    const firstCardSlot = seenCards.get(cardId)
    if (firstCardSlot !== undefined) {
      issues.push({ code: 'duplicate-card', slot, firstSlot: firstCardSlot, cardId })
      continue
    }
    seenCards.set(cardId, slot)

    const card = catalog.get(cardId)
    if (!card) {
      issues.push({ code: 'unknown-card', slot, cardId })
      continue
    }
    if (card.category !== 'Pokemon') {
      issues.push({ code: 'not-pokemon', slot, cardId })
      continue
    }

    const speciesId = card.speciesIds[0]
    if (
      card.mapping !== 'species' ||
      card.speciesIds.length !== 1 ||
      !Number.isSafeInteger(speciesId) ||
      speciesId <= 0
    ) {
      issues.push({ code: 'unresolved-species', slot, cardId })
      continue
    }
    if (!knownSpecies.has(speciesId)) {
      issues.push({ code: 'unknown-species', slot, cardId, speciesId })
      continue
    }

    const firstSpeciesSlot = seenSpecies.get(speciesId)
    if (firstSpeciesSlot !== undefined) {
      issues.push({ code: 'duplicate-species', slot, firstSlot: firstSpeciesSlot, cardId, speciesId })
      continue
    }
    seenSpecies.set(speciesId, slot)
    members.push({ cardId, speciesId })
  }

  return issues.length ? { valid: false, issues } : { valid: true, members }
}
