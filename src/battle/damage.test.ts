import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateDamage } from './damage.ts'
import type { DamageInput } from './types.ts'

const base: DamageInput = {
  moveType: 'fire',
  power: 40,
  attack: 90,
  defense: 75,
  attackerTypes: ['fire'],
  defenderTypes: ['normal'],
  defenderHp: 1000,
}

test('damage applies affinity and type multipliers with the agreed numeric examples', () => {
  const cases: [Partial<DamageInput>, number, number, boolean][] = [
    [{}, 60, 1, true],
    [{ attackerTypes: ['normal'] }, 48, 1, false],
    [{ attackerTypes: ['flying', 'fire'] }, 60, 1, true],
    [{ defenderTypes: ['grass'] }, 120, 2, true],
    [{ defenderTypes: ['grass', 'steel'] }, 240, 4, true],
    [{ defenderTypes: ['water'] }, 30, 0.5, true],
    [{ defenderTypes: ['water', 'dragon'] }, 15, 0.25, true],
  ]
  for (const [patch, damage, effectiveness, sameTypeBonus] of cases) {
    assert.deepEqual(calculateDamage({ ...base, ...patch }), {
      damage,
      remainingHp: 1000 - damage,
      effectiveness,
      sameTypeBonus,
      rulesetVersion: 'lumemon-damage-v1',
    })
  }
})

test('burn, boost and barrier combine once and round only the final rational value', () => {
  assert.equal(calculateDamage({ ...base, burned: true }).damage, 48)
  assert.equal(calculateDamage({ ...base, boosted: true }).damage, 90)
  assert.equal(calculateDamage({ ...base, shielded: true }).damage, 42)
  assert.equal(
    calculateDamage({
      ...base,
      defenderTypes: ['grass'],
      burned: true,
      boosted: true,
      shielded: true,
    }).damage,
    100,
  )
  assert.equal(
    calculateDamage({ ...base, power: 3, attack: 1, defense: 2, boosted: true }).damage,
    2,
  )
  assert.equal(
    calculateDamage({ ...base, power: 10, attack: 1, defense: 1, burned: true, boosted: true })
      .damage,
    15,
  )
  assert.deepEqual(
    calculateDamage({ ...base, burned: false, boosted: false, shielded: false }),
    calculateDamage(base),
  )
})

test('immunity stays zero with affinity and all modifiers rather than becoming minimum damage', () => {
  assert.deepEqual(
    calculateDamage({
      ...base,
      moveType: 'electric',
      attackerTypes: ['electric'],
      defenderTypes: ['water', 'ground'],
      burned: true,
      boosted: true,
      shielded: true,
    }),
    {
      damage: 0,
      remainingHp: 1000,
      effectiveness: 0,
      sameTypeBonus: true,
      rulesetVersion: 'lumemon-damage-v1',
    },
  )
})

test('nonimmune damage has minimum one and caps actual loss at remaining health', () => {
  assert.equal(
    calculateDamage({
      ...base,
      power: 1,
      attack: 1,
      defense: 1000,
      defenderTypes: ['water', 'dragon'],
    }).damage,
    1,
  )
  const result = calculateDamage({ ...base, defenderHp: 7 })
  assert.equal(result.damage, 7)
  assert.equal(result.remainingHp, 0)
  const huge = calculateDamage({
    ...base,
    power: Number.MAX_SAFE_INTEGER,
    attack: Number.MAX_SAFE_INTEGER,
    defense: 1,
    defenderHp: 9,
    boosted: true,
  })
  assert.equal(huge.damage, 9)
  assert.equal(huge.remainingHp, 0)
})

test('invalid numbers are rejected even against an immune target', () => {
  for (const field of ['power', 'attack', 'defense', 'defenderHp'] as const) {
    for (const value of [
      0,
      -1,
      0.5,
      NaN,
      Infinity,
      -Infinity,
      Number.MAX_SAFE_INTEGER + 1,
      '40',
      null,
      undefined,
    ]) {
      const input = {
        ...base,
        moveType: 'electric',
        defenderTypes: ['ground'],
        [field]: value,
      } as DamageInput
      assert.throws(() => calculateDamage(input), RangeError, `${field}: ${String(value)}`)
    }
  }
})

test('damage rejects malformed inputs, invalid attacker types and nonboolean modifiers', () => {
  for (const input of [null, undefined, {}, [], 'fire'])
    assert.throws(() => calculateDamage(input as DamageInput))
  for (const attackerTypes of [
    [],
    ['fire', 'fire'],
    ['Fire'],
    Array(1),
    ['fire', 'water', 'grass'],
    null,
  ]) {
    assert.throws(() => calculateDamage({ ...base, attackerTypes } as DamageInput), TypeError)
  }
  for (const field of ['burned', 'boosted', 'shielded']) {
    for (const value of [0, 1, 'false', null, {}]) {
      assert.throws(() => calculateDamage({ ...base, [field]: value }), TypeError)
    }
  }
})

test('frozen inputs remain unchanged and repeated calls produce independent JSON-safe results', () => {
  const input = Object.freeze({
    ...base,
    attackerTypes: Object.freeze(['fire'] as const),
    defenderTypes: Object.freeze(['grass'] as const),
  })
  const before = JSON.stringify(input)
  const first = calculateDamage(input)
  const second = calculateDamage(input)
  assert.deepEqual(first, second)
  assert.notEqual(first, second)
  assert.equal(first.damage, 120)
  assert.equal(JSON.stringify(input), before)
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first)
})
