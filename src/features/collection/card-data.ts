import artwork from '../practice/card-artwork.json'
import roster from '../../battle/data/starter-roster.json'
import type { CardRecord } from '../../catalog/types'
export const collectionArtwork = new Map((artwork as CardRecord[]).map((card) => [card.id, card]))
export const collectionSpecies = new Map(roster.species.map((s) => [s.speciesId, s]))
export const collectionFighters = new Map(roster.cards.map((c) => [c.id, c]))
export function cardLabel(id: string, locale: 'es' | 'en') {
  const card = collectionArtwork.get(id)
  return card?.localizations[locale]?.name ?? card?.localizations.en?.name ?? id
}
