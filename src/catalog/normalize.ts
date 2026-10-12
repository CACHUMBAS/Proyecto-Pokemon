import type { CardRecord, SpeciesRecord } from './types.ts'

type ObjectValue = Record<string, unknown>
function object(value: unknown): ObjectValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as ObjectValue)
    : {}
}
function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
function resourceId(value: unknown): number {
  return Number(text(value).match(/\/(\d+)\/?$/)?.[1])
}
export function safeImage(value: unknown): string | null {
  try {
    const url = new URL(text(value))
    return url.protocol === 'https:' &&
      ['assets.tcgdex.net', 'raw.githubusercontent.com'].includes(url.hostname)
      ? url.href
      : null
  } catch {
    return null
  }
}

export function normalizeSpecies(speciesValue: unknown, pokemonValue: unknown): SpeciesRecord {
  const species = object(speciesValue),
    pokemon = object(pokemonValue)
  if (
    !Number.isInteger(species.id) ||
    Number(species.id) < 1 ||
    !text(species.name) ||
    resourceId(object(pokemon.species).url) !== species.id
  )
    throw new Error('Invalid species identity')
  const generation = resourceId(object(species.generation).url)
  if (!Number.isInteger(generation) || generation < 1) throw new Error('Invalid species generation')
  const names = new Map(
    array(species.names).map((entry) => {
      const item = object(entry)
      return [text(object(item.language).name), text(item.name)]
    }),
  )
  const en = names.get('en') || text(species.name)
  const forms = array(species.varieties).map((entry) => {
    const item = object(entry),
      form = object(item.pokemon)
    return { id: resourceId(form.url), slug: text(form.name), isDefault: item.is_default === true }
  })
  if (
    !forms.length ||
    forms.some((form) => !Number.isInteger(form.id)) ||
    forms.filter((form) => form.isDefault).length !== 1 ||
    !forms.some((form) => form.isDefault && form.id === pokemon.id)
  )
    throw new Error('Invalid species forms')
  return {
    id: Number(species.id),
    slug: text(species.name),
    names: { en, es: names.get('es') || en },
    generation,
    types: array(pokemon.types)
      .map((entry) => text(object(object(entry).type).name))
      .filter(Boolean),
    imageUrl: safeImage(
      object(object(object(pokemon.sprites).other)['official-artwork']).front_default,
    ),
    forms,
    cardCount: 0,
    facets: [],
  }
}

export function normalizeCard(value: unknown, knownSpecies: ReadonlySet<number>): CardRecord {
  const raw = object(value),
    set = object(raw.set)
  const category = raw.category
  if (
    !text(raw.id) ||
    !text(raw.name) ||
    !text(set.id) ||
    !['Pokemon', 'Trainer', 'Energy'].includes(text(category))
  )
    throw new Error('Invalid card identity')
  const ids = [
    ...new Set(
      array(raw.dexId).filter((id): id is number => Number.isInteger(id) && Number(id) > 0),
    ),
  ]
  const speciesIds = ids.filter((id) => knownSpecies.has(id))
  const mapping =
    category !== 'Pokemon'
      ? 'support'
      : !ids.length || ids.length !== speciesIds.length
        ? 'unmapped'
        : ids.length > 1
          ? 'multiple'
          : 'species'
  return {
    id: text(raw.id),
    origin: 'tcgdex',
    category: category as CardRecord['category'],
    localizations: { en: { name: text(raw.name), imageUrl: safeImage(raw.image) } },
    speciesIds: category === 'Pokemon' ? speciesIds : [],
    mapping,
    rarity: text(raw.rarity) || 'unknown',
    tcgTypes: array(raw.types).map(text).filter(Boolean),
    set: { id: text(set.id), name: text(set.name) || text(set.id) },
    illustrator: text(raw.illustrator) || null,
  }
}

export function mergeLocalization(card: CardRecord, value: unknown): CardRecord {
  const raw = object(value)
  if (raw.id !== card.id || !text(raw.name)) throw new Error('Localization ID mismatch')
  return {
    ...card,
    localizations: {
      ...card.localizations,
      es: { name: text(raw.name), imageUrl: safeImage(raw.image) },
    },
  }
}

export function fallbackCard(species: SpeciesRecord): CardRecord {
  return {
    id: `prisma-${species.id}`,
    origin: 'pokeprisma',
    category: 'Pokemon',
    speciesIds: [species.id],
    mapping: 'species',
    localizations: {
      en: { name: species.names.en, imageUrl: species.imageUrl },
      es: { name: species.names.es, imageUrl: species.imageUrl },
    },
    rarity: 'prisma',
    tcgTypes: [],
    set: { id: 'prisma', name: 'Lumemon' },
    illustrator: null,
  }
}
