import test from 'node:test'
import assert from 'node:assert/strict'
import {
  readCollectionTheme,
  saveCollectionTheme,
  revealStep,
  completedTear,
} from './presentation.ts'
import type { RevealState } from './presentation.ts'

test('theme restores a valid choice and safely defaults for unknown or inaccessible storage', () => {
  assert.equal(readCollectionTheme({ getItem: () => 'midnight' }), 'midnight')
  assert.equal(readCollectionTheme({ getItem: () => 'pearl' }), 'pearl')
  assert.equal(readCollectionTheme({ getItem: () => 'invalid' }), 'pearl')
  assert.equal(
    readCollectionTheme({
      getItem: () => {
        throw Error('blocked')
      },
    }),
    'pearl',
  )
})
test('theme persists only its own key and reports blocked storage without throwing', () => {
  const writes: string[][] = []
  assert.equal(
    saveCollectionTheme(
      {
        setItem: (key, value) => {
          writes.push([key, value])
        },
      },
      'midnight',
    ),
    true,
  )
  assert.deepEqual(writes, [['lumemon.collection-theme.v1', 'midnight']])
  assert.equal(
    saveCollectionTheme(
      {
        setItem: () => {
          throw Error('full')
        },
      },
      'pearl',
    ),
    false,
  )
})
test('opening exposes one card at a time, then the summary, without overrunning the receipt', () => {
  let state: RevealState = { phase: 'sealed', visible: 0 }
  assert.deepEqual(revealStep(state, 'next', 3), state)
  state = revealStep(state, 'open', 3)
  assert.deepEqual(state, { phase: 'cards', visible: 1 })
  assert.deepEqual(revealStep(state, 'open', 3), state)
  state = revealStep(state, 'next', 3)
  assert.deepEqual(state, { phase: 'cards', visible: 2 })
  state = revealStep(state, 'next', 3)
  assert.deepEqual(state, { phase: 'cards', visible: 3 })
  state = revealStep(state, 'next', 3)
  assert.deepEqual(state, { phase: 'summary', visible: 3 })
  assert.deepEqual(revealStep(state, 'next', 3), state)
})
test('skip works from a sealed or partially revealed receipt and keeps every slot, including repeats', () => {
  for (const state of [
    { phase: 'sealed', visible: 0 },
    { phase: 'cards', visible: 1 },
  ] as RevealState[]) {
    assert.deepEqual(revealStep(state, 'all', 3), { phase: 'summary', visible: 3 })
  }
  assert.deepEqual(revealStep({ phase: 'sealed', visible: 0 }, 'open', 0), {
    phase: 'summary',
    visible: 0,
  })
})
test('tearing requires a deliberate horizontal gesture; scrolling and short taps do not open', () => {
  assert.equal(completedTear(120, 10, 260), true)
  assert.equal(completedTear(-120, 10, 260), true)
  assert.equal(completedTear(15, 0, 260), false)
  assert.equal(completedTear(120, 90, 260), false)
  assert.equal(completedTear(70, 10, 400), false)
})
