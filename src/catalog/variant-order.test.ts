import { test } from 'node:test'
import assert from 'node:assert/strict'
import { orderVariants } from '../features/catalog/to-card-preview.ts'
import { normalizeCard } from './normalize.ts'
test('cards with artwork come first without removing cards or mutating provider data', () => {
  const make = (id: string, image: string | null) =>
    normalizeCard(
      { id, name: id, image, category: 'Pokemon', dexId: [25], set: { id: 'test', name: 'Test' } },
      new Set([25]),
    )
  const a = make('a', null),
    b = make('b', 'https://assets.tcgdex.net/en/test/b'),
    c = make('c', null),
    d = make('d', 'https://assets.tcgdex.net/en/test/d')
  const input = [a, b, c, d]
  assert.deepEqual(
    orderVariants(input).map((c) => c.id),
    ['b', 'd', 'a', 'c'],
  )
  assert.deepEqual(
    input.map((c) => c.id),
    ['a', 'b', 'c', 'd'],
  )
})
