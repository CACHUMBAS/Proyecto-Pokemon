import type { CardRecord, CatalogQuery, SpeciesRecord } from '../catalog/types.ts'
import { listSpecies } from '../catalog/repository.ts'
import { listPlayableCards } from './playable-roster.ts'

const playableSpeciesByCard = new Map(listPlayableCards().map((card) => [card.id, card.speciesId]))
const playableSpecies = new Set(playableSpeciesByCard.values())

export function listTeamSpecies(
  species: SpeciesRecord[],
  query: CatalogQuery,
  playableOnly: boolean,
) {
  return listSpecies(
    playableOnly ? species.filter((s) => playableSpecies.has(s.id)) : species,
    query,
  )
}

export function listTeamVariants(cards: CardRecord[], search: string, playableOnly: boolean) {
  const term = search.trim().toLocaleLowerCase()
  return cards.filter(
    (card) =>
      (!playableOnly ||
        (card.category === 'Pokemon' &&
          card.mapping === 'species' &&
          card.speciesIds.length === 1 &&
          playableSpeciesByCard.get(card.id) === card.speciesIds[0])) &&
      [card.id, card.set.name, card.rarity].join(' ').toLocaleLowerCase().includes(term),
  )
}
