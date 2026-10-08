import type { CardRecord, CatalogLocale } from '../../catalog/types.ts'
import type { CardPreview } from '../../types/card-preview.ts'
export function toCardPreview(
  card: CardRecord,
  locale: CatalogLocale,
  quality: 'low' | 'high' = 'low',
): CardPreview {
  const language = card.localizations[locale]?.imageUrl
    ? locale
    : card.localizations.en?.imageUrl
      ? 'en'
      : card.localizations.es?.imageUrl
        ? 'es'
        : card.localizations[locale]
          ? locale
          : 'en'
  const localization =
    card.localizations[language] || card.localizations.en || card.localizations.es!
  return {
    id: card.id,
    name: localization.name,
    imageUrl: localization.imageUrl
      ? card.origin === 'tcgdex'
        ? `${localization.imageUrl}/${quality}.webp`
        : localization.imageUrl
      : null,
    origin: card.origin,
    language,
    rarityLabel: card.rarity,
    typeLabels: card.tcgTypes,
    illustrator: card.illustrator || undefined,
    sourceUrl:
      card.origin === 'tcgdex'
        ? `https://api.tcgdex.net/v2/${language}/cards/${encodeURIComponent(card.id)}`
        : `https://pokeapi.co/api/v2/pokemon-species/${card.speciesIds[0]}/`,
    presentation: card.origin === 'pokeprisma' ? 'prisma' : 'tcg',
  }
}

export function orderVariants(cards: CardRecord[]): CardRecord[] {
  const hasImage = (card: CardRecord) =>
    Boolean(card.localizations.en?.imageUrl || card.localizations.es?.imageUrl)
  return [...cards].sort((a, b) => Number(hasImage(b)) - Number(hasImage(a)))
}
