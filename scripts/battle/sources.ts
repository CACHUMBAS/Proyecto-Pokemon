import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { parse } from 'csv-parse/sync'
import type { CardRecord, SpeciesRecord } from '../../src/catalog/types.ts'
export const POKEAPI_COMMIT = '2ee1c422ad9f3831245dab0ac2a5cd1aae61cd72'
export const SOURCE_NAMES = [
  'pokemon',
  'pokemon_types',
  'pokemon_species_names',
  'types',
  'pokemon_stats',
  'stats',
  'moves',
  'move_names',
  'pokemon_moves',
  'version_groups',
  'pokemon_move_methods',
  'move_meta',
  'move_meta_ailments',
] as const
export interface SourceFile {
  url: string
  sourceSha256: string
  sha256: string
  rows: number
  header: string
}
export interface SourceManifest {
  schemaVersion: 1
  pokeapiCommit: string
  normalization: string
  files: Record<string, SourceFile>
}
export type Tables = Record<string, Record<string, string>[]>
export interface BattleSources {
  manifest: SourceManifest
  tables: Tables
  digest: string
}
export interface Selection {
  catalogVersion: string
  versionGroupId: number
  species: {
    speciesId: number
    cardIds: string[]
    moves: {
      moveId: number
      profile: 'basic' | 'strong' | 'poison' | 'burn' | 'paralysis' | 'sleep' | 'freeze'
    }[]
  }[]
}
export interface BattleCatalog {
  version: string
  species: SpeciesRecord[]
  cards: CardRecord[]
}
export function ensure(condition: unknown, field: string): asserts condition {
  if (!condition) throw new Error('Invalid ' + field)
}
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
export function parseSources(manifest: SourceManifest, raw: Record<string, string>): BattleSources {
  ensure(
    manifest?.schemaVersion === 1 && manifest.pokeapiCommit === POKEAPI_COMMIT,
    'source revision',
  )
  ensure(
    manifest.files && Object.keys(manifest.files).length === SOURCE_NAMES.length,
    'source manifest files',
  )
  const tables: Tables = {}
  for (const name of SOURCE_NAMES) {
    const file = manifest.files[name]
    ensure(
      file && /^[a-f0-9]{64}$/.test(file.sourceSha256) && /^[a-f0-9]{64}$/.test(file.sha256),
      'source hashes',
    )
    ensure(
      file.url ===
        'https://raw.githubusercontent.com/PokeAPI/pokeapi/' +
          POKEAPI_COMMIT +
          '/data/v2/csv/' +
          name +
          '.csv',
      'source URL',
    )
    ensure(typeof raw[name] === 'string', 'source text')
    const text = raw[name].replaceAll('\r\n', '\n')
    ensure(
      sha256(text) === file.sha256 && text.split('\n')[0] === file.header,
      'source integrity: ' + name,
    )
    const rows: Record<string, string>[] = parse(text, { columns: true, skip_empty_lines: true })
    ensure(
      Number.isSafeInteger(file.rows) && file.rows > 0 && rows.length === file.rows,
      'source row count',
    )
    tables[name] = rows
  }
  return { manifest: structuredClone(manifest), tables, digest: sha256(JSON.stringify(manifest)) }
}
export function loadSources(root: string): BattleSources {
  const directory = resolve(root, 'src/battle/data/sources')
  const manifest: SourceManifest = JSON.parse(
    readFileSync(resolve(directory, 'manifest.json'), 'utf8'),
  )
  const raw = Object.fromEntries(
    SOURCE_NAMES.map((name) => [name, readFileSync(resolve(directory, name + '.csv'), 'utf8')]),
  )
  return parseSources(manifest, raw)
}
export function loadCatalog(root: string, selection: Selection): BattleCatalog {
  ensure(/^[a-f0-9]{16}$/.test(selection.catalogVersion), 'catalog version')
  const manifest = JSON.parse(readFileSync(resolve(root, 'public/catalog/manifest.json'), 'utf8'))
  ensure(
    manifest.version === selection.catalogVersion &&
      manifest.sources.pokeapiCommit === POKEAPI_COMMIT,
    'catalog revision mismatch',
  )
  ensure(Array.isArray(selection.species) && selection.species.length > 0, 'species selection')
  const snapshot = resolve(root, 'public/catalog/snapshots', selection.catalogVersion)
  const species: SpeciesRecord[] = JSON.parse(
    readFileSync(resolve(snapshot, 'species.json'), 'utf8'),
  )
  const cards: CardRecord[] = []
  for (const item of selection.species) {
    ensure(
      Number.isSafeInteger(item.speciesId) && item.speciesId > 0 && Array.isArray(item.cardIds),
      'selected species',
    )
    const variants: CardRecord[] = JSON.parse(
      readFileSync(resolve(snapshot, 'variants', item.speciesId + '.json'), 'utf8'),
    )
    for (const id of item.cardIds) {
      const card = variants.find((c) => c.id === id)
      ensure(card, 'selected card not found: ' + id)
      cards.push(card)
    }
  }
  return { version: manifest.version, species, cards }
}
