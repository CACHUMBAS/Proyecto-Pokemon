import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { verifiedArtwork } from './artwork.ts'
import index from './artwork-supplements.json' with { type: 'json' }
import type { CardRecord } from './types.ts'
const manifest = JSON.parse(
  readFileSync(new URL('../../public/catalog/manifest.json', import.meta.url), 'utf8'),
)
const provenance = JSON.parse(
  readFileSync(
    new URL('../../public/assets/cards/supplements/_sources.json', import.meta.url),
    'utf8',
  ),
)
test('every curated supplement matches its species/set and both installed images match their recorded hashes', () => {
  assert.equal(new Set(index.cards.map((c) => c.id)).size, index.cards.length)
  assert.equal(index.cards.filter((c) => c.setId === '2011bw').length, 12)
  for (const art of index.cards) {
    const variants: CardRecord[] = JSON.parse(
      readFileSync(
        new URL(`../../public${manifest.variantsPath}/${art.speciesId}.json`, import.meta.url),
        'utf8',
      ),
    )
    const card = variants.find((c) => c.id === art.id)
    assert(card, art.id)
    assert.equal(verifiedArtwork(card)?.id, art.id)
    const source = provenance.cards.find((c: { id: string }) => c.id === art.id)
    assert(source, art.id)
    for (const quality of ['low', 'high'] as const) {
      const buffer = readFileSync(new URL(`../../public${art[quality]}`, import.meta.url))
      assert.equal(buffer.toString('ascii', 8, 12), 'WEBP')
      assert.equal(
        createHash('sha256').update(buffer).digest('hex'),
        source.outputs[quality].sha256,
      )
    }
  }
})
