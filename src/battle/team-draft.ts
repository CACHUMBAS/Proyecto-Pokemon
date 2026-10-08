import type { CardRecord, SpeciesRecord } from '../catalog/types.ts'
import { POKEMON_TEAM_SIZE, validatePokemonTeam, type PokemonTeamMember } from './team.ts'

export const TEAM_DRAFT_KEY = 'pokeprisma.team-draft.v1'
export interface TeamDraft {
  version: 1
  members: PokemonTeamMember[]
}
type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'>
type DraftRead = { kind: 'ready'; draft: TeamDraft } | { kind: 'invalid' | 'unavailable' }
export class InvalidTeamDraftError extends Error {}

export function readTeamDraft(storage: StorageAccess): DraftRead {
  let raw: string | null
  try {
    raw = storage().getItem(TEAM_DRAFT_KEY)
  } catch {
    return { kind: 'unavailable' }
  }
  if (raw === null) return { kind: 'ready', draft: { version: 1, members: [] } }
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1 ||
      !('members' in value) ||
      !Array.isArray(value.members) ||
      value.members.length > POKEMON_TEAM_SIZE
    ) {
      return { kind: 'invalid' }
    }
    const members: PokemonTeamMember[] = []
    for (const member of value.members) {
      if (
        !member ||
        typeof member !== 'object' ||
        typeof member.cardId !== 'string' ||
        !member.cardId.trim() ||
        member.cardId.length > 200 ||
        !Number.isSafeInteger(member.speciesId) ||
        member.speciesId < 1 ||
        members.some((m) => m.cardId === member.cardId || m.speciesId === member.speciesId)
      ) {
        return { kind: 'invalid' }
      }
      members.push({ cardId: member.cardId, speciesId: member.speciesId })
    }
    return { kind: 'ready', draft: { version: 1, members } }
  } catch {
    return { kind: 'invalid' }
  }
}

export function saveTeamDraft(
  cards: readonly CardRecord[],
  storage: StorageAccess,
  expected?: TeamDraft,
): 'saved' | 'unavailable' | 'conflict' {
  if (expected) {
    const current = readTeamDraft(storage)
    if (current.kind === 'unavailable') return 'unavailable'
    if (current.kind !== 'ready' || JSON.stringify(current.draft) !== JSON.stringify(expected))
      return 'conflict'
  }
  const draft: TeamDraft = {
    version: 1,
    members: cards.map((card) => ({ cardId: card.id, speciesId: card.speciesIds[0] })),
  }
  try {
    storage().setItem(TEAM_DRAFT_KEY, JSON.stringify(draft))
    return 'saved'
  } catch {
    return 'unavailable'
  }
}

function validComposition(cards: readonly CardRecord[], species: ReadonlySet<number>): boolean {
  if (cards.length > POKEMON_TEAM_SIZE) return false
  const result = validatePokemonTeam(
    cards.map((card) => card.id),
    new Map(cards.map((c) => [c.id, c])),
    species,
  )
  return result.valid || result.issues.every((issue) => issue.code === 'team-size')
}

export async function restoreTeamDraft(
  draft: TeamDraft,
  repository: {
    load(): Promise<{ species: SpeciesRecord[] }>
    listVariants(id: number): Promise<CardRecord[]>
  },
): Promise<CardRecord[]> {
  const species = new Set((await repository.load()).species.map((entry) => entry.id))
  if (draft.members.some((member) => !species.has(member.speciesId)))
    throw new InvalidTeamDraftError()
  const cards = await Promise.all(
    draft.members.map(async (member) => {
      const variants = await repository.listVariants(member.speciesId)
      const card = variants.find((entry) => entry.id === member.cardId)
      if (!card || card.speciesIds.length !== 1 || card.speciesIds[0] !== member.speciesId) {
        throw new InvalidTeamDraftError()
      }
      return card
    }),
  )
  if (!validComposition(cards, species)) throw new InvalidTeamDraftError()
  return cards
}

export function selectTeamCard(
  current: readonly CardRecord[],
  card: CardRecord,
  species: ReadonlySet<number>,
): {
  kind: 'added' | 'replaced' | 'unchanged' | 'full' | 'ineligible'
  cards: CardRecord[]
} {
  const cards = [...current]
  if (!validComposition([card], species)) return { kind: 'ineligible', cards }
  if (cards.some((entry) => entry.id === card.id)) return { kind: 'unchanged', cards }
  const existing = cards.findIndex((entry) => entry.speciesIds[0] === card.speciesIds[0])
  if (existing >= 0) {
    cards[existing] = card
    return { kind: 'replaced', cards }
  }
  if (cards.length >= POKEMON_TEAM_SIZE) return { kind: 'full', cards }
  return { kind: 'added', cards: [...cards, card] }
}
