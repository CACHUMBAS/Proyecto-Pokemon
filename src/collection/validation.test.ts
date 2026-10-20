import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseCollection, parseReceipt, parsePending } from './validation.ts'
import { collectionFixture, receiptFixture, TEST_USER, TEST_REQUEST } from './fixtures.ts'
test('accepts a valid snapshot and receipt for the verified identity', () => {
  assert.deepEqual(parseCollection(collectionFixture(), TEST_USER), collectionFixture())
  assert.deepEqual(parseReceipt(receiptFixture(), TEST_USER), receiptFixture())
})
test('rejects mismatched identity and unsafe wallet/inventory values', () => {
  const base = collectionFixture()
  for (const bad of [
    { ...base, user_id: 'another' },
    { ...base, wallet: { ...base.wallet, coins: -1 } },
    { ...base, inventory: [{ card_id: 'base1-44', quantity: 0 }] },
    { ...base, inventory: [{ card_id: 'invented', quantity: 1 }] },
  ])
    assert.throws(() => parseCollection(bad, TEST_USER))
})
test('rejects duplicate entries, unsupported version and misleading odds', () => {
  const base = collectionFixture()
  for (const bad of [
    { ...base, version: 'future' },
    { ...base, cards: [...base.cards, base.cards[0]] },
    { ...base, pack: { ...base.pack, odds: base.pack.odds.map((x) => ({ ...x, weight: 10000 })) } },
    { ...base, pack: { ...base.pack, odds: base.pack.odds.map((x) => ({ ...x, card_count: 1 })) } },
  ])
    assert.throws(() => parseCollection(bad, TEST_USER))
})
test('receipts cannot claim malformed gains or another identity', () => {
  for (const bad of [
    { ...receiptFixture(), user_id: 'another' },
    { ...receiptFixture(), quantity: 1 },
    { ...receiptFixture(), coins_delta: 100 },
    { ...receiptFixture(), created_at: 'invalid' },
  ])
    assert.throws(() => parseReceipt(bad, TEST_USER))
})
test('pending commands survive reload but invalid persisted commands are rejected', () => {
  const p = {
    requestId: TEST_REQUEST,
    command: { kind: 'pack', packId: 'prisma-v1', currency: 'welcome' },
  }
  assert.deepEqual(parsePending(p), p)
  for (const bad of [
    { ...p, requestId: 'bad' },
    { ...p, command: { kind: 'fragment', cardId: 'base1-44', quantity: 0 } },
    { ...p, command: { kind: 'pack', packId: 'prisma-v1', currency: 'invented' } },
  ])
    assert.throws(() => parsePending(bad))
})

test('rejects coerced receipt enums before validating economic deltas', () => {
  const pack = {
    ...receiptFixture(),
    kind: 'pack',
    reference: 'prisma-v1',
    quantity: 3,
    card_ids: ['base1-44', 'base1-46', 'base1-63'],
    currency: 'coins',
    coins_delta: -100,
  }
  const malformed = [
    { ...pack, currency: ['coins'], coins_delta: 999 },
    { ...pack, currency: new String('coins') },
    { ...receiptFixture(), kind: ['starter'], quantity: 1, card_ids: ['alba'], fragments_delta: 5 },
  ]
  for (const bad of malformed) {
    assert.throws(() => parseReceipt(bad, TEST_USER), { code: 'invalidData' })
    assert.throws(() => parseCollection({ ...collectionFixture(), events: [bad] }, TEST_USER), {
      code: 'invalidData',
    })
  }
})

test('rejects coerced budgets in definitions and rarity probabilities', () => {
  const base = collectionFixture()
  const stringifyBudgets = {
    ...base,
    cards: base.cards.map((card) => ({ ...card, budget: String(card.budget) })),
    pack: {
      ...base.pack,
      odds: base.pack.odds.map((odd) => ({ ...odd, budget: String(odd.budget) })),
    },
  }
  assert.throws(() => parseCollection(stringifyBudgets, TEST_USER), { code: 'invalidData' })
  assert.throws(
    () =>
      parseCollection(
        {
          ...base,
          cards: base.cards.map((card) => ({ ...card, budget: [card.budget] })),
        },
        TEST_USER,
      ),
    { code: 'invalidData' },
  )
})

test('rejects coerced currencies in persisted pending operations', () => {
  for (const currency of [['coins'], new String('welcome')]) {
    assert.throws(
      () =>
        parsePending({
          requestId: TEST_REQUEST,
          command: { kind: 'pack', packId: 'prisma-v1', currency },
        }),
      { code: 'invalidData' },
    )
  }
})
