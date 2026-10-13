import type { CardRecord } from '../catalog/types.ts'
import type {
  AssignedProfile,
  BaseStats,
  CardStats,
  StatBudget,
  VariantProfile,
} from './data-types.ts'

const RARITY_GROUPS: readonly [StatBudget, readonly string[]][] = [
  [240, ['Common', 'One Diamond', 'Promo', 'None', 'Classic Collection']],
  [252, ['Uncommon', 'Two Diamond']],
  [264, ['Rare', 'Holo Rare', 'Rare Holo', 'Three Diamond', 'Double rare', 'Shiny rare']],
  [
    276,
    [
      'Holo Rare V',
      'Holo Rare VMAX',
      'Holo Rare VSTAR',
      'Rare Holo LV.X',
      'Rare PRIME',
      'LEGEND',
      'Ultra Rare',
      'Illustration rare',
      'Amazing Rare',
      'Radiant Rare',
      'Shiny rare V',
      'Shiny rare VMAX',
      'One Star',
      'Four Diamond',
      'One Shiny',
      'Pikachu Rare',
      'Mega Attack Rare',
      'Futuristic Rare',
      'RGB Rare',
    ],
  ],
  [
    288,
    [
      'Secret Rare',
      'Special illustration rare',
      'Hyper rare',
      'Shiny Ultra Rare',
      'Crown',
      'Two Star',
      'Three Star',
      'Two Shiny',
      'Black White Rare',
      'Mega Hyper Rare',
    ],
  ],
]
const BUDGETS = [240, 252, 264, 276, 288]
function valid(condition: unknown, field: string): asserts condition {
  if (!condition) throw new Error('Invalid ' + field)
}
export function getStatBudget(
  card: Pick<CardRecord, 'category' | 'origin' | 'rarity'>,
): StatBudget {
  valid(card && card.category === 'Pokemon', 'Pokemon card')
  if (card.origin === 'pokeprisma') return 240
  valid(card.origin === 'tcgdex', 'card origin')
  const group = RARITY_GROUPS.find(([, rarities]) => rarities.includes(card.rarity))
  valid(group, 'unclassified rarity')
  return group[0]
}
export function calculateCardStats(
  base: BaseStats,
  budget: StatBudget,
  profile: VariantProfile,
): CardStats {
  valid(Array.isArray(base) && base.length === 6, 'base statistics')
  for (const n of base) valid(Number.isSafeInteger(n) && n > 0, 'base statistic')
  valid(BUDGETS.includes(budget), 'stat budget')
  valid(Array.isArray(profile) && profile.length === 4, 'variant profile')
  for (const n of profile) valid(Number.isInteger(n) && Math.abs(n) <= 8, 'profile displacement')
  valid(profile.reduce((sum, n) => sum + n, 0) === 0, 'profile total')
  const mean = (a: number, b: number) => Number((BigInt(a) + BigInt(b)) / 2n)
  const weights = [base[0], mean(base[1], base[3]), mean(base[2], base[4]), base[5]].map((n) =>
    Math.max(40, Math.min(160, n)),
  )
  const total = weights.reduce((a, b) => a + b, 0)
  const points = weights.map((n) => Math.floor((budget * n) / total))
  const order = weights
    .map((n, i) => ({ i, remainder: (budget * n) % total }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i)
  const remaining = budget - points.reduce((a, b) => a + b, 0)
  for (let i = 0; i < remaining; i++) points[order[i].i] += 1
  for (let i = 0; i < 4; i++) {
    points[i] += profile[i]
    valid(points[i] >= 0, 'negative allocation')
  }
  return {
    points: points as CardStats['points'],
    maxHp: 120 + 2 * points[0],
    attack: 30 + points[1],
    defense: 30 + points[2],
    speed: 30 + points[3],
  }
}
function* candidates(): Generator<VariantProfile> {
  yield [0, 5, -5, 0]
  yield [0, -5, 5, 0]
  yield [0, 0, 0, 0]
  for (let hp = -8; hp <= 8; hp++)
    for (let attack = -8; attack <= 8; attack++)
      for (let defense = -8; defense <= 8; defense++) {
        const speed = -hp - attack - defense
        if (Math.abs(speed) <= 8) yield [hp, attack, defense, speed]
      }
}
/** For one species. Assignments are persisted in a versioned snapshot, never rerolled at runtime. */
export function assignVariantProfiles(
  base: BaseStats,
  cards: readonly { id: string; budget: StatBudget }[],
): AssignedProfile[] {
  valid(Array.isArray(cards) && cards.length > 0, 'variant cards')
  const ids = new Set<string>()
  for (const card of cards) {
    valid(
      card && typeof card.id === 'string' && card.id.length > 0 && !ids.has(card.id),
      'variant ID',
    )
    valid(BUDGETS.includes(card.budget), 'variant budget')
    ids.add(card.id)
  }
  const used = new Set<string>()
  return [...cards]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((card) => {
      for (const profile of candidates()) {
        const stats = calculateCardStats(base, card.budget, profile)
        const key = stats.points.join(',')
        if (used.has(key)) continue
        used.add(key)
        return { ...card, profile, stats }
      }
      throw new Error('Invalid exhausted unique profiles')
    })
}
