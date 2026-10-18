import { POKEMON_TEAM_SIZE } from './team.ts'
import { getPlayableCard } from './playable-roster.ts'

export type PracticeTeamIssue =
  | { code: 'invalid-data' }
  | { code: 'team-size'; count: number }
  | { code: 'unplayable-card' | 'duplicate-species'; slot: number; cardId: string }
export type PracticeTeamValidation =
  { valid: true; cardIds: string[] } | { valid: false; issues: PracticeTeamIssue[] }
export type PracticeTeamTransfer =
  | { kind: 'none' }
  | { kind: 'ready'; cardIds: string[] }
  | { kind: 'invalid'; issues: PracticeTeamIssue[] }

export function validatePracticeTeam(value: unknown): PracticeTeamValidation {
  const invalid: PracticeTeamValidation = { valid: false, issues: [{ code: 'invalid-data' }] }
  if (!Array.isArray(value)) return invalid
  const issues: PracticeTeamIssue[] = []
  if (value.length !== POKEMON_TEAM_SIZE) issues.push({ code: 'team-size', count: value.length })
  if (value.length > POKEMON_TEAM_SIZE) return { valid: false, issues }
  const cardIds: string[] = []
  // Array iteration includes holes; never treat a sparse team as six valid slots.
  for (const id of value as unknown[]) {
    if (typeof id !== 'string' || !id.trim() || id.length > 200) return invalid
    cardIds.push(id)
  }
  const seenSpecies = new Set<number>()
  for (const [slot, cardId] of cardIds.entries()) {
    const card = getPlayableCard(cardId)
    if (!card) issues.push({ code: 'unplayable-card', slot, cardId })
    else if (seenSpecies.has(card.speciesId))
      issues.push({ code: 'duplicate-species', slot, cardId })
    else seenSpecies.add(card.speciesId)
  }
  return issues.length ? { valid: false, issues } : { valid: true, cardIds }
}
export function readPracticeTeamTransfer(state: unknown): PracticeTeamTransfer {
  if (state === null || state === undefined) return { kind: 'none' }
  if (
    typeof state !== 'object' ||
    !('kind' in state) ||
    state.kind !== 'lumemon-practice-team' ||
    !('version' in state) ||
    state.version !== 1 ||
    !('cardIds' in state)
  )
    return { kind: 'invalid', issues: [{ code: 'invalid-data' }] }
  const result = validatePracticeTeam(state.cardIds)
  return result.valid
    ? { kind: 'ready', cardIds: result.cardIds }
    : { kind: 'invalid', issues: result.issues }
}
