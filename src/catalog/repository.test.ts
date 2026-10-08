import { test } from 'node:test'
import assert from 'node:assert/strict'
import { listSpecies } from './repository.ts'
import type { SpeciesRecord } from './types.ts'
const species: SpeciesRecord[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  slug: `species-${i + 1}`,
  names: { es: i === 29 ? 'Último' : `Especie ${i + 1}`, en: `Species ${i + 1}` },
  generation: i === 29 ? 9 : 1,
  types: i === 29 ? ['electric'] : ['grass'],
  imageUrl: null,
  forms: [],
  cardCount: 2,
  facets:
    i === 29
      ? [
          { rarity: 'Rare', setId: 'new' },
          { rarity: 'Common', setId: 'old' },
        ]
      : [{ rarity: 'Common', setId: 'old' }],
}))
test('search and generation/type filters apply before pagination across all species', () => {
  assert.deepEqual(
    listSpecies(species, { search: 'ultimo', locale: 'es', pageSize: 12 }).items.map((s) => s.id),
    [30],
  )
  assert.equal(listSpecies(species, { generation: '9', type: 'electric', pageSize: 12 }).total, 1)
})
test('rarity and set filters must match the same variant', () => {
  assert.equal(listSpecies(species, { rarity: 'Rare', set: 'old' }).total, 0)
  assert.equal(listSpecies(species, { rarity: 'Rare', set: 'new' }).total, 1)
})
test('clamps stale or invalid page and supports exact national dex number', () => {
  assert.equal(listSpecies(species, { page: 999, pageSize: 12 }).page, 3)
  assert.equal(listSpecies(species, { page: -5 }).page, 1)
  assert.deepEqual(
    listSpecies(species, { search: '#0030' }).items.map((s) => s.id),
    [30],
  )
})
test('empty results have no items and a valid page, not stale previous results', () => {
  const result = listSpecies(species, { search: 'no-result', page: 5 })
  assert.equal(result.total, 0)
  assert.equal(result.page, 1)
  assert.deepEqual(result.items, [])
})
