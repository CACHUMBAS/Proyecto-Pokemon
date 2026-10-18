import { listBattleSpecies, listPlayableCards } from '../../battle/playable-roster.ts'
import artwork from './card-artwork.json'
import supportArtwork from './support-artwork.json'
import type { CardRecord } from '../../catalog/types.ts'
import type { Locale } from '../../i18n'
export const species = listBattleSpecies()
export const cards = listPlayableCards()
export const cardsById = new Map(cards.map((card) => [card.id, card]))
export const speciesById = new Map(species.map((item) => [item.speciesId, item]))
export const artworkById = new Map(
  ([...artwork, ...supportArtwork] as CardRecord[]).map((card) => [card.id, card]),
)
export function fighterName(id: string, locale: Locale): string {
  return speciesById.get(cardsById.get(id)!.speciesId)!.names[locale]
}
export function moveName(id: string, locale: Locale): string {
  return species.flatMap((s) => s.moves).find((m) => m.move.id === id)!.names[locale]
}

import type { BattleResult } from '../../battle/engine-types'
export function resultKey(result: BattleResult): string {
  return result.kind === 'draw' ? 'draw' : result.winner === 0 ? 'win' : 'lose'
}
