import roster from '../battle/data/starter-roster.json' with { type: 'json' }
import type { CollectionSnapshot, CollectionReceipt } from './types.ts'
export const TEST_USER = 'aa100000-0000-4000-8000-000000000001'
export const TEST_REQUEST = 'aa100000-0000-4000-8000-000000000002'
export function collectionFixture(): CollectionSnapshot {
  const values: Record<number, number> = { 240: 5, 252: 10, 264: 20, 276: 40, 288: 80 }
  const cards = roster.cards.map((c) => ({
    card_id: c.id,
    species_id: c.speciesId,
    budget: c.budget,
    fragment_value: values[c.budget],
  }))
  return {
    user_id: TEST_USER,
    version: 'lumemon-economy-v1',
    wallet: { coins: 0, fragments: 0, starter_id: null, welcome_available: false, revision: 0 },
    inventory: [],
    cards,
    starters: [
      {
        id: 'alba',
        card_ids: ['base1-44', 'base1-46', 'base1-63', 'base1-58', 'base1-52', 'base2-51'],
      },
    ],
    pack: {
      id: 'prisma-v1',
      coins: 100,
      fragments: 60,
      size: 3,
      odds: [6000, 2500, 1000, 400, 100].map((weight, i) => ({
        weight,
        budget: [240, 252, 264, 276, 288][i],
        card_count: cards.filter((c) => c.budget === [240, 252, 264, 276, 288][i]).length,
      })),
    },
    events: [],
  }
}
export function receiptFixture(): CollectionReceipt {
  return {
    user_id: TEST_USER,
    request_id: TEST_REQUEST,
    kind: 'starter',
    reference: 'alba',
    currency: null,
    card_ids: collectionFixture().starters[0].card_ids,
    quantity: 6,
    coins_delta: 0,
    fragments_delta: 0,
    created_at: '2026-10-20T10:00:00Z',
  }
}
