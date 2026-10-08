import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeCard, normalizeSpecies, mergeLocalization, fallbackCard } from './normalize.ts'
const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'))
const pika = fixture('species-pikachu')
const pokemon = fixture('pokemon-pikachu')
const umbreon = fixture('card-umbreon')

test('species uses official IDs, Spanish/English names and default form types', () => {
  const record = normalizeSpecies(pika, pokemon)
  assert.equal(record.id, 25)
  assert.equal(record.names.es, 'Pikachu')
  assert.equal(record.generation, 1)
  assert.deepEqual(record.types, ['electric'])
  assert.equal(record.forms.find((form) => form.isDefault)?.id, 25)
  assert(record.imageUrl?.endsWith('/25.png'))
})
test('absent Spanish name falls back to the actual English name and image can be missing', () => {
  const record = normalizeSpecies(
    {
      ...pika,
      names: pika.names.filter((n: { language: { name: string } }) => n.language.name === 'en'),
    },
    { ...pokemon, sprites: {} },
  )
  assert.equal(record.names.es, 'Pikachu')
  assert.equal(record.imageUrl, null)
})
test('inconsistent Pokemon/species identity is rejected', () => {
  assert.throws(
    () =>
      normalizeSpecies(pika, {
        ...pokemon,
        species: { url: 'https://pokeapi.co/api/v2/pokemon-species/6/' },
      }),
    /species/i,
  )
})
test('cards preserve TCG type independently of species types and use dexId only', () => {
  const record = normalizeCard(umbreon, new Set([197]))
  assert.deepEqual(record.speciesIds, [197])
  assert.equal(record.mapping, 'species')
  assert.deepEqual(record.tcgTypes, ['Darkness'])
  assert.equal(record.localizations.en?.name, 'Umbreon VMAX')
})
test('cards named like a Pokemon without dexId remain unmapped', () => {
  const record = normalizeCard({ ...umbreon, dexId: undefined, name: 'Pikachu' }, new Set([25]))
  assert.equal(record.mapping, 'unmapped')
  assert.deepEqual(record.speciesIds, [])
})
test('multiple species and unknown references remain ambiguous', () => {
  assert.equal(
    normalizeCard({ ...umbreon, dexId: [25, 197] }, new Set([25, 197])).mapping,
    'multiple',
  )
  assert.equal(
    normalizeCard({ ...umbreon, dexId: [197, 99999] }, new Set([197])).mapping,
    'unmapped',
  )
})
test('missing optional card fields and unsafe image URLs do not create invented values', () => {
  const record = normalizeCard(
    { ...umbreon, image: 'javascript:alert(1)', rarity: null, types: null },
    new Set([197]),
  )
  assert.equal(record.localizations.en?.imageUrl, null)
  assert.equal(record.rarity, 'unknown')
  assert.deepEqual(record.tcgTypes, [])
})
test('Spanish localization joins by provider ID, never by translated name', () => {
  const card = normalizeCard(umbreon, new Set([197]))
  assert.throws(() => mergeLocalization(card, { id: 'another', name: 'Umbreon' }), /id/i)
  const result = mergeLocalization(card, { id: card.id, name: 'Umbreon VMAX', image: null })
  assert.equal(result.localizations.es?.imageUrl, null)
  assert.equal(result.localizations.en?.imageUrl, 'https://assets.tcgdex.net/en/swsh/swsh7/215')
})
test('support cards never acquire species mappings', () => {
  const record = normalizeCard(
    { ...umbreon, category: 'Trainer', dexId: undefined },
    new Set([197]),
  )
  assert.equal(record.mapping, 'support')
})
test('fallback cards are explicitly custom and retain source artwork only', () => {
  const record = fallbackCard(normalizeSpecies(pika, pokemon))
  assert.equal(record.origin, 'pokeprisma')
  assert.equal(record.id, 'prisma-25')
  assert.deepEqual(record.speciesIds, [25])
  assert.equal(record.localizations.es?.name, 'Pikachu')
})
test('malformed card identity is rejected before importing', () => {
  assert.throws(() => normalizeCard({ name: 'Unknown' }, new Set()), /card/i)
})
