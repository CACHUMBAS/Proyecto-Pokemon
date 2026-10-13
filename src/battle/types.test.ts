import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { getTypeEffectiveness } from './type-chart.ts'
import type { PokemonType } from './types.ts'

function fixture(name: string, hash: string) {
  const raw = readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8').replace(
    /\r\n/g,
    '\n',
  )
  assert.equal(createHash('sha256').update(raw).digest('hex'), hash)
  return raw
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.split(','))
}

test('all 324 attacking/defending pairs match the pinned PokeAPI source', () => {
  const types = new Map(
    fixture('types.csv', '37f039c8d722f47d51ba1c5c5ecf9b7007235b1a9a1af2827645c777b70307c8')
      .filter(([id]) => Number(id) >= 1 && Number(id) <= 18)
      .map(([id, name]) => [id, name as PokemonType]),
  )
  const pairs = fixture(
    'type-efficacy.csv',
    'cdd7de4066680414d0a2433af805f139f425d6350cbf998ecab559a0fe8ff587',
  ).filter(([attack, defend]) => types.has(attack) && types.has(defend))
  assert.equal(types.size, 18)
  assert.equal(pairs.length, 324)
  for (const [attack, defend, factor] of pairs) {
    assert.equal(
      getTypeEffectiveness(types.get(attack)!, Object.freeze([types.get(defend)!])),
      Number(factor) / 100,
      `${attack} -> ${defend}`,
    )
  }
})

test('dual types multiply weaknesses and resistances and preserve immunity in either order', () => {
  const cases: [PokemonType, PokemonType[], number][] = [
    ['fire', ['grass', 'steel'], 4],
    ['fire', ['water', 'dragon'], 0.25],
    ['fire', ['grass', 'water'], 1],
    ['electric', ['water', 'ground'], 0],
    ['ground', ['electric', 'flying'], 0],
    ['fighting', ['normal', 'ghost'], 0],
    ['dragon', ['dragon', 'fairy'], 0],
    ['psychic', ['poison', 'dark'], 0],
  ]
  for (const [attack, types, expected] of cases) {
    assert.equal(getTypeEffectiveness(attack, types), expected)
    assert.equal(getTypeEffectiveness(attack, [...types].reverse()), expected)
  }
})

test('invalid or TCG types, duplicates, empty, oversized and sparse lists are rejected', () => {
  for (const attack of ['Fire', 'Colorless', 'stellar', '__proto__', '', null, 13]) {
    assert.throws(() => getTypeEffectiveness(attack as PokemonType, ['normal']), TypeError)
  }
  for (const defenders of [
    [],
    ['fire', 'fire'],
    ['fire', 'water', 'grass'],
    ['Fire'],
    ['__proto__'],
    [null],
    Array(1),
    undefined,
    null,
    'fire',
  ]) {
    assert.throws(() => getTypeEffectiveness('fire', defenders as PokemonType[]), TypeError)
  }
})
