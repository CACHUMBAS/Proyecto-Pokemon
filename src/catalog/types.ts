export type CatalogLocale = 'es' | 'en'
export interface SpeciesRecord {
  id: number
  slug: string
  names: Record<CatalogLocale, string>
  generation: number
  types: string[]
  imageUrl: string | null
  forms: { id: number; slug: string; isDefault: boolean }[]
  cardCount: number
  facets: { rarity: string; setId: string }[]
}
export interface CardRecord {
  id: string
  origin: 'tcgdex' | 'pokeprisma'
  category: 'Pokemon' | 'Trainer' | 'Energy'
  localizations: Partial<Record<CatalogLocale, { name: string; imageUrl: string | null }>>
  speciesIds: number[]
  mapping: 'species' | 'multiple' | 'unmapped' | 'support'
  rarity: string
  tcgTypes: string[]
  set: { id: string; name: string }
  illustrator: string | null
}
export interface CatalogManifest {
  schemaVersion: 1
  version: string
  generatedAt: string
  expectedSpecies: number
  species: number
  cards: number
  pokemonCards: number
  supportCards: number
  mappedSpecies: number
  fallbackSpecies: number[]
  ambiguousCards: number
  cardsWithoutImage: number
  sourceCounts: { en: number; es: number }
  sources: { pokeapiCommit: string; artworkTree: string }
  speciesFile: string
  variantsPath: string
  rarities: string[]
  sets: { id: string; name: string }[]
}
export interface CatalogQuery {
  search?: string
  generation?: string
  type?: string
  rarity?: string
  set?: string
  page?: number
  pageSize?: number
  locale?: CatalogLocale
}
