import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { CardRecord } from './types.ts'
import { toCardPreview, orderVariants } from '../features/catalog/to-card-preview.ts'
const manifest = JSON.parse(
  readFileSync(new URL('../../public/catalog/manifest.json', import.meta.url), 'utf8'),
)
const cards: CardRecord[] = JSON.parse(
  readFileSync(new URL(`../../public${manifest.variantsPath}/495.json`, import.meta.url), 'utf8'),
)
const snivy = cards.find((c) => c.id === '2011bw-1')!
test('McDonalds 2011 uses a verified local illustration in list and enlarged view with actual language and source', () => {
  const low = toCardPreview(snivy, 'es'),
    high = toCardPreview(snivy, 'en', 'high')
  assert.equal(low.imageUrl, '/assets/cards/supplements/mcd11-1-low.webp')
  assert.equal(high.imageUrl, '/assets/cards/supplements/mcd11-1-high.webp')
  assert.equal(low.language, 'en')
  assert.match(low.imageSourceUrl!, /^https:\/\/github.com\/PokemonTCG\/pokemon-tcg-data\/blob\//)
  assert.match(low.sourceUrl!, /tcgdex.net\/v2\/en\/cards\/2011bw-1/)
})
test('supplement never replaces available primary artwork or a different species/set', () => {
  const available = {
    ...snivy,
    localizations: {
      en: { name: 'Snivy', imageUrl: 'https://assets.tcgdex.net/en/test/1' },
      es: { name: 'Snivy', imageUrl: 'https://assets.tcgdex.net/es/test/1' },
    },
  }
  assert.equal(
    toCardPreview(available, 'es').imageUrl,
    'https://assets.tcgdex.net/es/test/1/low.webp',
  )
  assert.equal(toCardPreview({ ...snivy, speciesIds: [25] }, 'es').imageUrl, null)
  assert.equal(
    toCardPreview({ ...snivy, set: { id: 'another', name: 'Another' } }, 'es').imageUrl,
    null,
  )
})
test('recovered illustrations participate in artwork-first ordering without mutating records', () => {
  const missing = { ...snivy, id: 'unknown-1' }
  assert.deepEqual(
    orderVariants([missing, snivy]).map((c) => c.id),
    [snivy.id, missing.id],
  )
  assert.equal(snivy.localizations.en?.imageUrl, null)
})
