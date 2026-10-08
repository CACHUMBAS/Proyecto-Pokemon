import type { Locale } from '../i18n'

export interface CardPreview {
  id: string
  name: string
  imageUrl: string | null
  rarityLabel: string
  typeLabels: string[]
  origin: 'tcgdex' | 'pokeprisma'
  language: Locale | 'other'
  presentation?: 'tcg' | 'prisma'
  illustrator?: string
  imageSourceUrl?: string
  sourceUrl?: string
}
