import type { FighterDefinition, BattleMove } from './engine-types.ts'
import type { PokemonType } from './types.ts'
export type BaseStats = readonly [number, number, number, number, number, number]
export type VariantProfile = readonly [number, number, number, number]
export type StatBudget = 240 | 252 | 264 | 276 | 288
export interface CardStats {
  points: [number, number, number, number]
  maxHp: number
  attack: number
  defense: number
  speed: number
}
export interface AssignedProfile {
  id: string
  budget: StatBudget
  profile: VariantProfile
  stats: CardStats
}
export interface VerifiedMove {
  move: BattleMove
  names: { es: string; en: string }
  source: {
    moveId: number
    slug: string
    typeId: number
    damageClassId: number
    power: number | null
    accuracy: number | null
    priority: number
    ailment: string
    learnedBy: { methodId: number; method: string; level: number }[]
  }
}
export interface BattleSpecies {
  speciesId: number
  pokemonId: number
  slug: string
  names: { es: string; en: string }
  baseStats: BaseStats
  types: PokemonType[]
  moves: VerifiedMove[]
}
export interface PlayableCard extends FighterDefinition {
  rarity: string
  budget: StatBudget
  profile: VariantProfile
  points: readonly [number, number, number, number]
}
export interface BattleRoster {
  schemaVersion: 1
  version: string
  catalogVersion: string
  source: {
    pokeapiCommit: string
    sourcesDigest: string
    selectionDigest: string
    versionGroup: { id: number; slug: string }
  }
  species: BattleSpecies[]
  cards: PlayableCard[]
}
