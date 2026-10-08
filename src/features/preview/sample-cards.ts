import type { CardPreview } from '../../types/card-preview'

// Verified against TCGdex on 2026-10-08. These are display samples, not inventory.
export const sampleCards: readonly CardPreview[] = [
  {
    id: 'swsh7-215',
    name: 'Umbreon VMAX',
    imageUrl: '/assets/cards/swsh7-215.webp',
    rarityLabel: 'Secret Rare',
    typeLabels: ['Darkness'],
    origin: 'tcgdex',
    language: 'en',
    illustrator: 'KEIICHIRO ITO',
    sourceUrl: 'https://api.tcgdex.net/v2/en/cards/swsh7-215',
  },
  {
    id: 'sv03-199',
    name: 'Ninetales',
    imageUrl: '/assets/cards/sv03-199.webp',
    rarityLabel: 'Illustration rare',
    typeLabels: ['Fire'],
    origin: 'tcgdex',
    language: 'en',
    illustrator: 'SIE NANAHARA',
    sourceUrl: 'https://api.tcgdex.net/v2/en/cards/sv03-199',
  },
  {
    id: 'sv03-223',
    name: 'Charizard ex',
    imageUrl: '/assets/cards/sv03-223.webp',
    rarityLabel: 'Special illustration rare',
    typeLabels: ['Darkness'],
    origin: 'tcgdex',
    language: 'en',
    illustrator: 'AKIRA EGAWA',
    sourceUrl: 'https://api.tcgdex.net/v2/en/cards/sv03-223',
  },
]

export const missingImageSample: CardPreview = {
  id: 'prisma-preview',
  name: 'preview.noImageName',
  imageUrl: null,
  rarityLabel: 'preview.noImageRarity',
  typeLabels: ['preview.noImageType'],
  origin: 'pokeprisma',
  language: 'other',
}
