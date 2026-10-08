import type { CatalogQuery, SpeciesRecord } from './types.ts'

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
export function listSpecies(species: SpeciesRecord[], query: CatalogQuery) {
  const search = fold(query.search || '')
  const number = /^#?0*(\d+)$/.exec(search)?.[1]
  const locale = query.locale || 'es'
  const filtered = species.filter(
    (s) =>
      (!search ||
        (number
          ? s.id === Number(number)
          : [s.names[locale], s.names.en, s.slug].some((name) => fold(name).includes(search)))) &&
      (!query.generation || s.generation === Number(query.generation)) &&
      (!query.type || s.types.includes(query.type)) &&
      ((!query.rarity && !query.set) ||
        s.facets.some(
          (f) =>
            (!query.rarity || f.rarity === query.rarity) && (!query.set || f.setId === query.set),
        )),
  )
  const pageSize = Math.max(1, Math.min(48, Math.trunc(query.pageSize || 24)))
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.max(
    1,
    Math.min(pages, Number.isFinite(query.page) ? Math.trunc(query.page || 1) : 1),
  )
  return {
    items: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    pages,
    page,
  }
}
