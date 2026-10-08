import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createCatalogRepository } from './client.ts'
const sourceManifest = JSON.parse(
  readFileSync(new URL('../../public/catalog/manifest.json', import.meta.url), 'utf8'),
)
const sourceRecords = JSON.parse(
  readFileSync(new URL(`../../public${sourceManifest.speciesFile}`, import.meta.url), 'utf8'),
)

const manifest = { ...sourceManifest, species: 2, expectedSpecies: 2 }
const records = [
  sourceRecords.find((s: { id: number }) => s.id === 25),
  sourceRecords.find((s: { id: number }) => s.id === 1025),
]

test('concurrent loads share requests; lookup finds last species without loading card details', async () => {
  const requests: string[] = []
  const fetcher = (async (url: string | URL | Request) => {
    requests.push(String(url))
    return Response.json(String(url).endsWith('manifest.json') ? manifest : records)
  }) as typeof fetch
  const repository = createCatalogRepository(fetcher)
  await Promise.all([repository.load(), repository.load()])
  assert.equal(requests.length, 2)
  assert.equal((await repository.getSpecies(1025))?.names.en, 'Pecharunt')
  assert.equal(await repository.getSpecies(-1), undefined)
})
test('invalid JSON shape never enters successful cache and a retry can recover', async () => {
  let broken = true
  const repository = createCatalogRepository((async (url: string | URL | Request) =>
    Response.json(
      String(url).endsWith('manifest.json') ? manifest : broken ? [{ id: 1 }] : records,
    )) as typeof fetch)
  await assert.rejects(() => repository.load(), /catalog/i)
  broken = false
  assert.equal((await repository.load()).species.length, 2)
})
test('nonlocal snapshot URLs and inconsistent species counts are rejected', async () => {
  const unsafe = createCatalogRepository((async () =>
    Response.json({ ...manifest, speciesFile: 'https://other.example/data.json' })) as typeof fetch)
  await assert.rejects(() => unsafe.load(), /catalog/i)
  const partial = createCatalogRepository((async (url: string | URL | Request) =>
    Response.json(
      String(url).endsWith('manifest.json') ? manifest : records.slice(0, 1),
    )) as typeof fetch)
  await assert.rejects(() => partial.load(), /catalog/i)
})
test('failed detail requests are retryable, successful details are cached per snapshot', async () => {
  let fail = true
  const variants = JSON.parse(
    readFileSync(new URL(`../../public${manifest.variantsPath}/25.json`, import.meta.url), 'utf8'),
  )
  let detailRequests = 0
  const repo = createCatalogRepository((async (url: string | URL | Request) => {
    const path = String(url)
    if (path.endsWith('/25.json')) {
      detailRequests++
      return fail ? new Response('offline', { status: 503 }) : Response.json(variants)
    }
    return Response.json(path.endsWith('manifest.json') ? manifest : records)
  }) as typeof fetch)
  await assert.rejects(() => repo.listVariants(25))
  fail = false
  assert((await repo.listVariants(25)).length > 0)
  await repo.listVariants(25)
  assert.equal(detailRequests, 2)
})

test('unsupported card languages are rejected before caching and can be retried', async () => {
  const valid = JSON.parse(
    readFileSync(new URL(`../../public${manifest.variantsPath}/25.json`, import.meta.url), 'utf8'),
  )
  const invalid = structuredClone(valid)
  invalid[0].localizations = { fr: { name: 'Pikachu', imageUrl: null } }
  let broken = true
  const repo = createCatalogRepository((async (url: string | URL | Request) => {
    const path = String(url)
    return Response.json(
      path.endsWith('/25.json')
        ? broken
          ? invalid
          : valid
        : path.endsWith('manifest.json')
          ? manifest
          : records,
    )
  }) as typeof fetch)
  await assert.rejects(() => repo.listVariants(25), /catalog/i)
  broken = false
  assert.equal((await repo.listVariants(25)).length, records[0].cardCount)
})
test('variant shards must match the index and contain unique identities', async (t) => {
  const valid = JSON.parse(
    readFileSync(new URL(`../../public${manifest.variantsPath}/25.json`, import.meta.url), 'utf8'),
  )
  for (const [name, variants] of [
    ['empty', []],
    ['partial', valid.slice(0, -1)],
    ['duplicate', [...valid.slice(0, -1), valid[0]]],
    ['unexpected custom card', [...valid, { ...valid[0], id: 'prisma-25', origin: 'pokeprisma' }]],
  ] as const) {
    await t.test(name, async () => {
      const repo = createCatalogRepository((async (url: string | URL | Request) => {
        const path = String(url)
        return Response.json(
          path.endsWith('/25.json')
            ? variants
            : path.endsWith('manifest.json')
              ? manifest
              : records,
        )
      }) as typeof fetch)
      await assert.rejects(() => repo.listVariants(25), /catalog/i)
    })
  }
})

test('an expected custom fallback is accepted separately from the TCG count', async () => {
  const { fallbackCard } = await import('./normalize.ts')
  const species = { ...records[0], cardCount: 0 }
  const custom = fallbackCard(species)
  let missing = true
  const fallbackManifest = { ...manifest, species: 1, expectedSpecies: 1, fallbackSpecies: [25] }
  const repo = createCatalogRepository((async (url: string | URL | Request) => {
    const path = String(url)
    return Response.json(
      path.endsWith('/25.json')
        ? missing
          ? []
          : [custom]
        : path.endsWith('manifest.json')
          ? fallbackManifest
          : [species],
    )
  }) as typeof fetch)
  await assert.rejects(() => repo.listVariants(25), /catalog/i)
  missing = false
  assert.deepEqual(await repo.listVariants(25), [custom])
})
