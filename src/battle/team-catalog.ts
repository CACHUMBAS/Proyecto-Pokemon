import type { CardRecord, CatalogLocale, CatalogQuery, SpeciesRecord } from '../catalog/types.ts'
import { listSpecies } from '../catalog/repository.ts'
import { listPlayableCards, listBattleSpecies } from './playable-roster.ts'
import type { BattleMove } from './engine-types.ts'
import type { PokemonType } from './types.ts'

const playableCards = new Map(listPlayableCards().map((card) => [card.id, card]))
const playableSpecies = new Set([...playableCards.values()].map((card) => card.speciesId))
const battleSpecies = new Map(listBattleSpecies().map((species) => [species.speciesId, species]))

function matchingPlayableCard(card: CardRecord) {
  const fighter = playableCards.get(card.id)
  return fighter &&
    card.category === 'Pokemon' &&
    card.mapping === 'species' &&
    card.speciesIds.length === 1 &&
    card.speciesIds[0] === fighter.speciesId
    ? fighter
    : undefined
}

export function listTeamSpecies(
  species: SpeciesRecord[],
  query: CatalogQuery,
  playableOnly: boolean,
) {
  return listSpecies(
    playableOnly ? species.filter((s) => playableSpecies.has(s.id)) : species,
    query,
  )
}

export function listTeamVariants(cards: CardRecord[], search: string, playableOnly: boolean) {
  const term = search.trim().toLocaleLowerCase()
  return cards.filter(
    (card) =>
      (!playableOnly || matchingPlayableCard(card) !== undefined) &&
      [card.id, card.set.name, card.rarity].join(' ').toLocaleLowerCase().includes(term),
  )
}

export interface TeamBattleDetails {
  id: string
  types: readonly PokemonType[]
  stats: { maxHp: number; attack: number; defense: number; speed: number }
  moves: (BattleMove & { names: Record<CatalogLocale, string> })[]
}

export function getTeamBattleDetails(card: CardRecord): TeamBattleDetails | undefined {
  const fighter = matchingPlayableCard(card)
  if (!fighter) return undefined
  const species = battleSpecies.get(fighter.speciesId)!
  return {
    id: fighter.id,
    types: [...fighter.types],
    stats: {
      maxHp: fighter.maxHp,
      attack: fighter.attack,
      defense: fighter.defense,
      speed: fighter.speed,
    },
    moves: fighter.moves.map((move) => ({
      ...move,
      names: { ...species.moves.find((entry) => entry.move.id === move.id)!.names },
    })),
  }
}
