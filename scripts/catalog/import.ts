import { parse } from 'csv-parse/sync'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { cachedText, publishSnapshot } from './storage.ts'
import { verifyCoverage } from './coverage.ts'
import {
  normalizeSpecies,
  normalizeCard,
  mergeLocalization,
  fallbackCard,
} from '../../src/catalog/normalize.ts'
import type { CatalogManifest, CardRecord } from '../../src/catalog/types.ts'

const cache = resolve('.cache/catalog')
const refresh = process.argv.includes('--refresh')
const pokeapiCommit = '2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72'
const artworkTree = 'a8a8f6e6e36c83ca4538b5a95257ead5d02a7a8f'
async function request(url: string, init?: RequestInit) {
  let last: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
      return await response.text()
    } catch (error) {
      last = error
      if (attempt < 2) await delay(500 * (attempt + 1))
    }
  }
  throw last
}
async function json(
  key: string,
  url: string,
  validate: (value: Record<string, unknown>) => void,
  init?: RequestInit,
) {
  return JSON.parse(
    await cachedText(
      cache,
      key,
      () => request(url, init),
      (text) => validate(JSON.parse(text)),
      refresh,
    ),
  )
}
async function csv(name: string): Promise<Record<string, string>[]> {
  const validate = (value: string) => {
    const rows = parse(value, { columns: true, skip_empty_lines: true })
    if (!rows.length) throw new Error(`Empty CSV: ${name}`)
  }
  const raw = await cachedText(
    cache,
    `${name}.csv`,
    () =>
      request(
        `https://raw.githubusercontent.com/PokeAPI/pokeapi/${pokeapiCommit}/data/v2/csv/${name}.csv`,
      ),
    validate,
    refresh,
  )
  return parse(raw, { columns: true, skip_empty_lines: true })
}
function requireArray(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value) || !value.length) throw new Error('Invalid source array')
}
async function run() {
  const expectedIds: number[] = []
  let next: string | null = 'https://pokeapi.co/api/v2/pokemon-species?limit=500'
  let page = 0,
    expectedCount = 0
  const visited = new Set<string>()
  while (next) {
    if (visited.has(next) || !next.startsWith('https://pokeapi.co/api/v2/pokemon-species?'))
      throw new Error('Invalid species pagination')
    visited.add(next)
    const list = await json(`species-page-${page++}.json`, next, (value) => {
      if (!Array.isArray(value.results) || !Number.isInteger(value.count))
        throw new Error('Invalid species index')
    })
    if (expectedCount && expectedCount !== list.count)
      throw new Error('Species count changed during import')
    expectedCount = list.count
    for (const entry of list.results) {
      const id = Number(String(entry.url).match(/\/(\d+)\/$/)?.[1])
      if (!id) throw new Error('Invalid species URL')
      expectedIds.push(id)
    }
    next = list.next
  }
  if (expectedIds.length !== expectedCount) throw new Error('Incomplete species index')
  console.log(`PokéAPI: ${expectedCount} species; reading cached official data tables`)
  const tables: Record<string, Record<string, string>[]> = {}
  for (const name of [
    'pokemon_species',
    'pokemon_species_names',
    'pokemon',
    'pokemon_types',
    'types',
  ])
    tables[name] = await csv(name)
  const artwork = await json(
    'artwork-tree.json',
    `https://api.github.com/repos/PokeAPI/sprites/git/trees/${artworkTree}`,
    (value) => {
      if (value.truncated !== false || !Array.isArray(value.tree))
        throw new Error('Incomplete artwork tree')
    },
  )
  const artworkFiles = new Set(artwork.tree.map((entry: { path: string }) => entry.path))
  const typeNames = new Map(tables.types.map((row) => [row.id, row.identifier]))
  const species = tables.pokemon_species
    .filter((row) => expectedIds.includes(Number(row.id)))
    .map((row) => {
      const forms = tables.pokemon.filter((form) => form.species_id === row.id)
      const primary = forms.find((form) => form.is_default === '1')
      if (!primary) throw new Error(`Missing default form ${row.id}`)
      const image = artworkFiles.has(`${primary.id}.png`)
        ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${primary.id}.png`
        : null
      return normalizeSpecies(
        {
          id: Number(row.id),
          name: row.identifier,
          generation: { url: `https://pokeapi.co/api/v2/generation/${row.generation_id}/` },
          names: tables.pokemon_species_names
            .filter(
              (n) => n.pokemon_species_id === row.id && ['7', '9'].includes(n.local_language_id),
            )
            .map((n) => ({
              name: n.name,
              language: { name: n.local_language_id === '7' ? 'es' : 'en' },
            })),
          varieties: forms.map((f) => ({
            is_default: f.is_default === '1',
            pokemon: { name: f.identifier, url: `https://pokeapi.co/api/v2/pokemon/${f.id}/` },
          })),
        },
        {
          id: Number(primary.id),
          species: { url: `https://pokeapi.co/api/v2/pokemon-species/${row.id}/` },
          types: tables.pokemon_types
            .filter((t) => t.pokemon_id === primary.id)
            .sort((a, b) => Number(a.slot) - Number(b.slot))
            .map((t) => ({ type: { name: typeNames.get(t.type_id) } })),
          sprites: { other: { 'official-artwork': { front_default: image } } },
        },
      )
    })
    .sort((a, b) => a.id - b.id)
  console.log('TCGdex: reading English metadata and Spanish image/name index')
  const enIndex = await json('tcg-en-list.json', 'https://api.tcgdex.net/v2/en/cards', requireArray)
  const esIndex = await json('tcg-es-list.json', 'https://api.tcgdex.net/v2/es/cards', requireArray)
  const query =
    '{ cards { id name image category rarity dexId types illustrator set { id name } } }'
  const en = await json(
    'tcg-en-detail-raw.json',
    'https://api.tcgdex.net/v2/graphql',
    (value) => {
      const result = value as { errors?: unknown; data?: { cards?: unknown } }
      if (result.errors) throw new Error('TCGdex GraphQL errors')
      requireArray(result.data?.cards)
    },
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    },
  )
  const known = new Set(expectedIds)
  const esMap = new Map<string, unknown>(esIndex.map((c: { id: string }) => [c.id, c]))
  const cards: CardRecord[] = en.data.cards
    .map((raw: unknown) => {
      const c = normalizeCard(raw, known)
      return esMap.has(c.id) ? mergeLocalization(c, esMap.get(c.id)) : c
    })
    .sort((a: CardRecord, b: CardRecord) => a.id.localeCompare(b.id))
  const cardIds = new Set(cards.map((c) => c.id))
  if (
    cards.length !== enIndex.length ||
    enIndex.some((c: { id: string }) => !cardIds.has(c.id)) ||
    esIndex.some((c: { id: string }) => !cardIds.has(c.id))
  )
    throw new Error('TCGdex language index mismatch; do not publish incomplete snapshot')
  const coverage = verifyCoverage(expectedIds, species, cards)
  const bySpecies = new Map<number, CardRecord[]>(species.map((s) => [s.id, []]))
  for (const card of cards) for (const id of card.speciesIds) bySpecies.get(id)?.push(card)
  for (const s of species) {
    const variants = bySpecies.get(s.id)!
    s.cardCount = variants.length
    s.facets = [
      ...new Map(
        variants.map((c) => [
          JSON.stringify([c.rarity, c.set.id]),
          { rarity: c.rarity, setId: c.set.id },
        ]),
      ).values(),
    ]
    if (coverage.fallbackSpecies.includes(s.id)) variants.push(fallbackCard(s))
  }
  const version = createHash('sha256')
    .update(JSON.stringify({ species, cards, artworkTree, pokeapiCommit }))
    .digest('hex')
    .slice(0, 16)
  const prefix = `snapshots/${version}`
  const manifest: CatalogManifest = {
    schemaVersion: 1,
    version,
    generatedAt: new Date().toISOString(),
    expectedSpecies: expectedCount,
    species: species.length,
    cards: cards.length,
    pokemonCards: cards.filter((c) => c.category === 'Pokemon').length,
    supportCards: cards.filter((c) => c.category !== 'Pokemon').length,
    ...coverage,
    sourceCounts: { en: enIndex.length, es: esIndex.length },
    sources: { pokeapiCommit, artworkTree },
    speciesFile: `/catalog/${prefix}/species.json`,
    variantsPath: `/catalog/${prefix}/variants`,
    rarities: [
      ...new Set(cards.filter((c) => c.category === 'Pokemon').map((c) => c.rarity)),
    ].sort(),
    sets: [...new Map(cards.map((c) => [c.set.id, c.set])).values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  }
  const files: Record<string, unknown> = {
    [`${prefix}/species.json`]: species,
    [`${prefix}/support.json`]: cards.filter((c) => c.category !== 'Pokemon'),
    [`${prefix}/unmapped.json`]: cards.filter(
      (c) => c.category === 'Pokemon' && c.mapping === 'unmapped',
    ),
  }
  for (const [id, variants] of bySpecies) files[`${prefix}/variants/${id}.json`] = variants
  await publishSnapshot(resolve('public/catalog'), manifest, files)
  console.log(JSON.stringify(manifest, null, 2).split('"rarities"')[0])
  console.log(
    `Published snapshot ${version}; ${Object.keys(files).length} files. Previous manifests were preserved until validation completed.`,
  )
}
await run()
