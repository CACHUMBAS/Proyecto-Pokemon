import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cachedText, publishSnapshot } from './storage.ts'
import { verifyCoverage } from './coverage.ts'
import { normalizeSpecies, normalizeCard } from '../../src/catalog/normalize.ts'
const species = normalizeSpecies(
  JSON.parse(
    await readFile(
      new URL('../../src/catalog/fixtures/species-pikachu.json', import.meta.url),
      'utf8',
    ),
  ),
  JSON.parse(
    await readFile(
      new URL('../../src/catalog/fixtures/pokemon-pikachu.json', import.meta.url),
      'utf8',
    ),
  ),
)
const card = normalizeCard(
  {
    id: 'test-1',
    name: 'Pikachu',
    category: 'Pokemon',
    dexId: [25],
    rarity: 'Rare',
    set: { id: 'test', name: 'Test' },
  },
  new Set([25]),
)
test('coverage rejects missing and duplicate species and duplicate cards', () => {
  assert.throws(() => verifyCoverage([25, 26], [species], [card]), /coverage/i)
  assert.throws(() => verifyCoverage([25], [species, species], [card]), /duplicate/i)
  assert.throws(() => verifyCoverage([25], [species], [card, card]), /duplicate/i)
})
test('coverage reports fallback explicitly, ambiguous mappings are not silently playable', () => {
  const result = verifyCoverage([25], [species], [])
  assert.deepEqual(result.fallbackSpecies, [25])
  assert.equal(result.mappedSpecies, 0)
})
test('cache reuses validated data and repairs corrupt entries', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'prisma-cache-'))
  try {
    const validate = (value: string) => {
      assert.equal(JSON.parse(value).ok, true)
    }
    await cachedText(directory, 'sample', async () => ' {"ok":true}', validate)
    const reused = await cachedText(
      directory,
      'sample',
      async () => {
        throw Error('must use cache')
      },
      validate,
    )
    assert.equal(JSON.parse(reused).ok, true)
    await writeFile(join(directory, 'sample'), 'broken')
    const repaired = await cachedText(directory, 'sample', async () => ' {"ok":true}', validate)
    assert.equal(JSON.parse(repaired).ok, true)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
test('failed refresh preserves previous cache and failed publication preserves manifest', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'prisma-publish-'))
  try {
    await writeFile(join(directory, 'sample'), '{"ok":true}')
    await assert.rejects(() =>
      cachedText(directory, 'sample', async () => 'broken', JSON.parse, true),
    )
    assert.equal(JSON.parse(await readFile(join(directory, 'sample'), 'utf8')).ok, true)
    await writeFile(join(directory, 'manifest.json'), '{"version":"old"}')
    const invalid: Record<string, unknown> = {}
    invalid.self = invalid
    await assert.rejects(() =>
      publishSnapshot(directory, { version: 'new' }, { 'species.json': invalid }),
    )
    assert.equal(
      JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')).version,
      'old',
    )
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
