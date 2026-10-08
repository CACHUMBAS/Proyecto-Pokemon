import type { CatalogManifest, SpeciesRecord, CardRecord } from './types.ts'
import { safeImage } from './normalize.ts'

type ObjectValue = Record<string, unknown>
const obj = (value: unknown): value is ObjectValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string')
function validSpecies(value: unknown): value is SpeciesRecord {
  if (
    !obj(value) ||
    !Number.isInteger(value.id) ||
    Number(value.id) < 1 ||
    typeof value.slug !== 'string' ||
    !obj(value.names) ||
    typeof value.names.es !== 'string' ||
    typeof value.names.en !== 'string' ||
    !Number.isInteger(value.generation) ||
    !strings(value.types)
  )
    return false
  return (
    (value.imageUrl === null || safeImage(value.imageUrl) === value.imageUrl) &&
    Array.isArray(value.forms) &&
    value.forms.every(
      (f) =>
        obj(f) &&
        Number.isInteger(f.id) &&
        typeof f.slug === 'string' &&
        typeof f.isDefault === 'boolean',
    ) &&
    Number.isInteger(value.cardCount) &&
    Array.isArray(value.facets) &&
    value.facets.every((f) => obj(f) && typeof f.rarity === 'string' && typeof f.setId === 'string')
  )
}
function validCard(value: unknown): value is CardRecord {
  if (
    !obj(value) ||
    typeof value.id !== 'string' ||
    !['tcgdex', 'pokeprisma'].includes(String(value.origin)) ||
    !['Pokemon', 'Trainer', 'Energy'].includes(String(value.category)) ||
    !['species', 'multiple', 'unmapped', 'support'].includes(String(value.mapping)) ||
    !Array.isArray(value.speciesIds) ||
    !value.speciesIds.every(Number.isInteger) ||
    typeof value.rarity !== 'string' ||
    !strings(value.tcgTypes) ||
    !obj(value.set) ||
    typeof value.set.id !== 'string' ||
    typeof value.set.name !== 'string' ||
    !obj(value.localizations)
  )
    return false
  const locales = Object.values(value.localizations)
  return (
    locales.length > 0 &&
    locales.every(
      (l) =>
        obj(l) &&
        typeof l.name === 'string' &&
        (l.imageUrl === null || safeImage(l.imageUrl) === l.imageUrl),
    )
  )
}
function validManifest(value: unknown): value is CatalogManifest {
  if (
    !obj(value) ||
    value.schemaVersion !== 1 ||
    !/^[a-f0-9]{16}$/.test(String(value.version)) ||
    !Number.isInteger(value.species) ||
    Number(value.species) < 1 ||
    value.expectedSpecies !== value.species
  )
    return false
  const prefix = `/catalog/snapshots/${value.version}`
  return (
    value.speciesFile === `${prefix}/species.json` &&
    value.variantsPath === `${prefix}/variants` &&
    strings(value.rarities) &&
    Array.isArray(value.sets) &&
    value.sets.every((s) => obj(s) && typeof s.id === 'string' && typeof s.name === 'string') &&
    Number.isInteger(value.pokemonCards) &&
    Number.isFinite(Date.parse(String(value.generatedAt)))
  )
}

export function createCatalogRepository(fetcher: typeof fetch = fetch) {
  let catalog: Promise<{ manifest: CatalogManifest; species: SpeciesRecord[] }> | undefined
  const details = new Map<string, Promise<CardRecord[]>>()
  async function getJson(path: string): Promise<unknown> {
    const response = await fetcher(path, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`)
    return response.json()
  }
  function load() {
    catalog ??= (async () => {
      const manifest = await getJson('/catalog/manifest.json')
      if (!validManifest(manifest)) throw new Error('Invalid catalog manifest')
      const species = await getJson(manifest.speciesFile)
      if (
        !Array.isArray(species) ||
        species.length !== manifest.species ||
        !species.every(validSpecies) ||
        new Set(species.map((s) => s.id)).size !== species.length
      )
        throw new Error('Invalid catalog species')
      return { manifest, species }
    })().catch((error) => {
      catalog = undefined
      throw error
    })
    return catalog
  }
  return {
    load,
    async getSpecies(id: number) {
      return (await load()).species.find((s) => s.id === id)
    },
    async listVariants(id: number) {
      if (!Number.isInteger(id) || id < 1) throw new Error('Invalid catalog species ID')
      const { manifest, species } = await load()
      if (!species.some((s) => s.id === id)) throw new Error('Unknown catalog species ID')
      const key = `${manifest.version}/${id}`
      if (!details.has(key)) {
        if (details.size >= 20) details.delete(details.keys().next().value!)
        details.set(
          key,
          getJson(`${manifest.variantsPath}/${id}.json`)
            .then((value) => {
              if (
                !Array.isArray(value) ||
                !value.every(validCard) ||
                value.some((c) => !c.speciesIds.includes(id))
              )
                throw new Error('Invalid catalog variants')
              return value
            })
            .catch((error) => {
              details.delete(key)
              throw error
            }),
        )
      }
      return details.get(key)!
    },
    retry() {
      catalog = undefined
      details.clear()
    },
  }
}
export const catalogRepository = createCatalogRepository()
