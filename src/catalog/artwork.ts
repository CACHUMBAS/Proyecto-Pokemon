import type { CardRecord } from './types.ts'
import archive from './artwork-supplements.json' with { type: 'json' }

const artworks = new Map(archive.cards.map((entry) => [entry.id, entry]))

export function verifiedArtwork(card: CardRecord) {
  const artwork = artworks.get(card.id)
  return artwork &&
    card.origin === 'tcgdex' &&
    card.category === 'Pokemon' &&
    card.mapping === 'species' &&
    card.set.id === artwork.setId &&
    card.speciesIds.length === 1 &&
    card.speciesIds[0] === artwork.speciesId
    ? artwork
    : undefined
}
