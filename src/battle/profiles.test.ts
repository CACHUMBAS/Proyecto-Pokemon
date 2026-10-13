import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { getStatBudget, calculateCardStats, assignVariantProfiles } from './profiles.ts'
import type { BaseStats, StatBudget, VariantProfile } from './data-types.ts'
const pika: BaseStats = [35, 55, 40, 50, 50, 90]
const neutral: VariantProfile = [0, 0, 0, 0]
test('exact Pikachu examples, profile shifts, and rare budget preserve the agreed formula', () => {
  assert.deepEqual(calculateCardStats(pika, 240, neutral), {
    points: [42, 55, 48, 95],
    maxHp: 204,
    attack: 85,
    defense: 78,
    speed: 125,
  })
  assert.deepEqual(calculateCardStats(pika, 240, [0, 5, -5, 0]), {
    points: [42, 60, 43, 95],
    maxHp: 204,
    attack: 90,
    defense: 73,
    speed: 125,
  })
  assert.deepEqual(calculateCardStats(pika, 288, neutral), {
    points: [51, 66, 57, 114],
    maxHp: 222,
    attack: 96,
    defense: 87,
    speed: 144,
  })
})
test('budgets are conserved, weights clamped, fractions and ties assigned exactly', () => {
  for (const budget of [240, 252, 264, 276, 288] as const) {
    for (const base of [
      pika,
      [1, 1, 1, 1, 1, 1],
      [255, 255, 255, 255, 255, 255],
      [1, 255, 99, 1, 40, 160],
    ] as BaseStats[]) {
      assert.equal(
        calculateCardStats(base, budget, neutral).points.reduce((a, b) => a + b, 0),
        budget,
      )
    }
  }
  assert.deepEqual(
    calculateCardStats([40, 40, 40, 40, 40, 41], 240, neutral).points,
    [60, 60, 59, 61],
  )
  const huge = Array(6).fill(Number.MAX_SAFE_INTEGER) as unknown as BaseStats
  assert.deepEqual(calculateCardStats(huge, 240, neutral).points, [60, 60, 60, 60])
})
test('invalid base stats, budget and profiles are rejected, including sparse arrays', () => {
  for (const bad of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1, '35']) {
    const b = [...pika]
    b[0] = bad as number
    assert.throws(() => calculateCardStats(b as unknown as BaseStats, 240, neutral), /Invalid/)
  }
  assert.throws(() => calculateCardStats(new Array(6) as unknown as BaseStats, 240, neutral), /Invalid/)
  for (const p of [[0, 0, 0, 1], [9, -9, 0, 0], [0.5, -0.5, 0, 0], [], new Array(4)]) {
    assert.throws(() => calculateCardStats(pika, 240, p as unknown as VariantProfile), /Invalid/)
  }
  assert.throws(() => calculateCardStats(pika, 250 as StatBudget, neutral), /Invalid/)
})
test('all 42 catalog rarities have explicit budgets; unknown rarities and support cards fail', () => {
  const { rarities } = JSON.parse(
    readFileSync(new URL('../../public/catalog/manifest.json', import.meta.url), 'utf8'),
  )
  assert.equal(rarities.length, 42)
  const known = rarities.map((rarity: string) =>
    getStatBudget({ origin: 'tcgdex', category: 'Pokemon', rarity }),
  )
  assert.deepEqual([...new Set(known)].sort(), [240, 252, 264, 276, 288])
  assert.equal(
    getStatBudget({ origin: 'tcgdex', category: 'Pokemon', rarity: 'Illustration rare' }),
    276,
  )
  assert.equal(getStatBudget({ origin: 'pokeprisma', category: 'Pokemon', rarity: 'prisma' }), 240)
  assert.throws(
    () => getStatBudget({ origin: 'tcgdex', category: 'Pokemon', rarity: 'New Ultra Rare' }),
    /Invalid/,
  )
  assert.throws(
    () => getStatBudget({ origin: 'tcgdex', category: 'Trainer', rarity: 'Common' }),
    /Invalid/,
  )
})
test('profiles are deterministic across input order, unique for 80 variants and do not mutate', () => {
  const cards = Array.from({ length: 80 }, (_, i) => ({
    id: 'card-' + String(i).padStart(3, '0'),
    budget: 240 as const,
  }))
  Object.freeze(cards)
  Object.freeze(pika)
  const first = assignVariantProfiles(pika, cards)
  assert.deepEqual(assignVariantProfiles(pika, [...cards].reverse()), first)
  assert.equal(new Set(first.map((c) => JSON.stringify(c.stats.points))).size, 80)
  assert.deepEqual(first[0].profile, [0, 5, -5, 0])
  assert.deepEqual(first[1].profile, [0, -5, 5, 0])
  for (const c of first) {
    assert.equal(
      c.profile.reduce((a, b) => a + b, 0),
      0,
    )
    assert(c.profile.every((x) => Math.abs(x) <= 8))
    assert.equal(
      c.stats.points.reduce((a, b) => a + b, 0),
      240,
    )
  }
  assert.throws(() => assignVariantProfiles(pika, [cards[0], cards[0]]), /Invalid/)
})
