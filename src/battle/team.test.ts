import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { CardRecord } from '../catalog/types.ts'
import { validatePokemonTeam } from './team.ts'

const species = new Set([1, 4, 7, 25, 133, 197])
const card = (speciesId: number, overrides: Partial<CardRecord> = {}): CardRecord => ({
  id: `card-${speciesId}`,
  origin: 'tcgdex',
  category: 'Pokemon',
  localizations: {},
  speciesIds: [speciesId],
  mapping: 'species',
  rarity: 'Common',
  tcgTypes: [],
  set: { id: 'test', name: 'Test' },
  illustrator: null,
  ...overrides,
})
const cards = [...species].map((id) => card(id))
const catalog = new Map(cards.map((entry) => [entry.id, entry]))
const selected = cards.map((entry) => entry.id)
const withCard = (entry: CardRecord) => new Map([...catalog, [entry.id, entry]])

function issuesFor(ids: readonly string[], records = catalog) {
  const result = validatePokemonTeam(ids, records, species)
  assert.equal(result.valid, false)
  assert(!result.valid)
  assert.equal('members' in result, false, 'invalid teams must not expose a partial team')
  return result.issues
}

test('six distinct species resolve from catalog IDs in the selected order without mutation', () => {
  const ids = Object.freeze([...selected].reverse())
  const before = structuredClone([...catalog])
  const result = validatePokemonTeam(ids, catalog, species)
  assert(result.valid)
  assert.deepEqual(
    result.members,
    [...species].reverse().map((speciesId) => ({ cardId: `card-${speciesId}`, speciesId })),
  )
  assert.deepEqual([...catalog], before)
  assert.deepEqual(ids, [...selected].reverse())
})

test('empty, short and oversized teams are rejected', () => {
  for (const ids of [[], selected.slice(0, 5), [...selected, selected[0]]]) {
    assert.deepEqual(issuesFor(ids)[0], {
      code: 'team-size',
      expected: 6,
      actual: ids.length,
    })
  }
})

test('a repeated card reports both slot positions', () => {
  assert.deepEqual(issuesFor([...selected.slice(0, 5), selected[0]]), [
    { code: 'duplicate-card', slot: 5, firstSlot: 0, cardId: selected[0] },
  ])
})

test('different illustrations or forms of the same species cannot fill two slots', () => {
  const variant = card(1, { id: 'bulbasaur-rare-art', rarity: 'Rare' })
  assert.deepEqual(issuesFor([...selected.slice(0, 5), variant.id], withCard(variant)), [
    { code: 'duplicate-species', slot: 5, firstSlot: 0, cardId: variant.id, speciesId: 1 },
  ])
})

test('an alternative rare illustration is allowed when its species is unique', () => {
  const variant = card(1, { id: 'bulbasaur-rare-art', rarity: 'Rare' })
  const result = validatePokemonTeam([variant.id, ...selected.slice(1)], withCard(variant), species)
  assert(result.valid)
  assert.deepEqual(result.members[0], { cardId: variant.id, speciesId: 1 })
})

test('unknown card IDs cannot be resolved by names or guessed species', () => {
  assert.deepEqual(issuesFor(['Pikachu', ...selected.slice(1)]), [
    { code: 'unknown-card', slot: 0, cardId: 'Pikachu' },
  ])
})

test('trainer and energy cards cannot occupy a Pokemon slot', () => {
  for (const category of ['Trainer', 'Energy'] as const) {
    const support = card(1, { id: category, category, mapping: 'support', speciesIds: [] })
    assert.deepEqual(issuesFor([support.id, ...selected.slice(1)], withCard(support)), [
      { code: 'not-pokemon', slot: 0, cardId: support.id },
    ])
  }
})

test('ambiguous, missing and inconsistent species mappings are rejected', () => {
  const cases: Partial<CardRecord>[] = [
    { mapping: 'multiple', speciesIds: [1, 4] },
    { mapping: 'unmapped', speciesIds: [1] },
    { mapping: 'support', speciesIds: [1] },
    { mapping: 'species', speciesIds: [] },
    { mapping: 'species', speciesIds: [1, 4] },
    { speciesIds: [0] },
    { speciesIds: [-1] },
    { speciesIds: [1.5] },
    { speciesIds: [NaN] },
  ]
  for (const overrides of cases) {
    const unresolved = card(1, overrides)
    assert.deepEqual(issuesFor(selected, withCard(unresolved)), [
      { code: 'unresolved-species', slot: 0, cardId: unresolved.id },
    ])
  }
})

test('a valid numeric species ID must also exist in the trusted species index', () => {
  const unknown = card(1, { speciesIds: [99999] })
  assert.deepEqual(issuesFor(selected, withCard(unknown)), [
    { code: 'unknown-species', slot: 0, cardId: unknown.id, speciesId: 99999 },
  ])
})

test('all independent slot problems are returned in order, with no partial team', () => {
  const support = card(1, { id: 'support', category: 'Energy', mapping: 'support' })
  assert.deepEqual(
    issuesFor(['missing', support.id, selected[2], selected[3], selected[4], selected[2]], withCard(support)),
    [
      { code: 'unknown-card', slot: 0, cardId: 'missing' },
      { code: 'not-pokemon', slot: 1, cardId: support.id },
      { code: 'duplicate-card', slot: 5, firstSlot: 2, cardId: selected[2] },
    ],
  )
})
