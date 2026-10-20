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
