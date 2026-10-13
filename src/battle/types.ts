export const POKEMON_TYPES = Object.freeze([
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
  'fire',
  'water',
  'grass',
  'electric',
  'psychic',
  'ice',
  'dragon',
  'dark',
  'fairy',
] as const)
export type PokemonType = (typeof POKEMON_TYPES)[number]
export type TypeEffectiveness = 0 | 0.25 | 0.5 | 1 | 2 | 4
export interface DamageInput {
  readonly moveType: PokemonType
  readonly power: number
  readonly attack: number
  readonly defense: number
  readonly attackerTypes: readonly PokemonType[]
  readonly defenderTypes: readonly PokemonType[]
  readonly defenderHp: number
  readonly burned?: boolean
  readonly boosted?: boolean
  readonly shielded?: boolean
}
export interface DamageResult {
  readonly damage: number
  readonly remainingHp: number
  readonly effectiveness: TypeEffectiveness
  readonly sameTypeBonus: boolean
  readonly rulesetVersion: 'lumemon-damage-v1'
}
