import type { CardRecord, SpeciesRecord } from '../../src/catalog/types.ts'

export function verifyCoverage(expected: number[], species: SpeciesRecord[], cards: CardRecord[]) {
  if (
    new Set(expected).size !== expected.length ||
    new Set(species.map((s) => s.id)).size !== species.length ||
    new Set(cards.map((c) => c.id)).size !== cards.length
  )
    throw new Error('Duplicate catalog identifiers')
  const actual = new Set(species.map((s) => s.id))
  if (actual.size !== expected.length || expected.some((id) => !actual.has(id)))
    throw new Error('Incomplete species coverage')
  const mapped = new Set(
    cards
      .filter((c) => c.category === 'Pokemon' && c.mapping === 'species')
      .flatMap((c) => c.speciesIds),
  )
  const fallbackSpecies = expected.filter((id) => !mapped.has(id))
  return {
    mappedSpecies: expected.length - fallbackSpecies.length,
    fallbackSpecies,
    ambiguousCards: cards.filter((c) => c.category === 'Pokemon' && c.mapping !== 'species').length,
    cardsWithoutImage: cards.filter((c) => !Object.values(c.localizations).some((l) => l?.imageUrl))
      .length,
  }
}
