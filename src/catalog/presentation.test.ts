import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toCardPreview } from '../features/catalog/to-card-preview.ts'
import { normalizeCard, mergeLocalization } from './normalize.ts'
const card = normalizeCard(
  {
    id: 'test-25',
    name: 'English name',
    image: 'https://assets.tcgdex.net/en/test/25',
    category: 'Pokemon',
    dexId: [25],
    types: ['Lightning'],
    rarity: 'Rare',
    set: { id: 'test', name: 'Test' },
  },
  new Set([25]),
)
test('Spanish UI uses the real language of the image when Spanish artwork is missing', () => {
  const localized = mergeLocalization(card, { id: card.id, name: 'Nombre español', image: null })
  const preview = toCardPreview(localized, 'es')
  assert.equal(preview.language, 'en')
  assert.equal(preview.name, 'English name')
  assert.equal(preview.imageUrl, 'https://assets.tcgdex.net/en/test/25/low.webp')
})
test('Spanish image is selected when available; high quality is explicit', () => {
  const localized = mergeLocalization(card, {
    id: card.id,
    name: 'Nombre español',
    image: 'https://assets.tcgdex.net/es/test/25',
  })
  const preview = toCardPreview(localized, 'es', 'high')
  assert.equal(preview.language, 'es')
  assert.equal(preview.imageUrl, 'https://assets.tcgdex.net/es/test/25/high.webp')
})
