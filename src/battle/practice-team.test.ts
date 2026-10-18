import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePracticeTeam, readPracticeTeamTransfer } from './practice-team.ts'
import { createPractice, practiceReducer, DEFAULT_PLAYER } from './practice.ts'
import { listPlayableCards, getPlayableCard } from './playable-roster.ts'
import { readTeamDraft, saveTeamDraft, restoreTeamDraft } from './team-draft.ts'
import artwork from '../features/practice/card-artwork.json' with { type: 'json' }
import type { CardRecord, SpeciesRecord } from '../catalog/types.ts'

const transfer = (cardIds: unknown) => ({ kind: 'lumemon-practice-team', version: 1, cardIds })

test('preserves exact variants, order and lead as detached values', () => {
  const variant = listPlayableCards().find((c) => c.speciesId === 25 && c.id !== 'base1-58')!
  const ids = [variant.id, ...DEFAULT_PLAYER.filter((id) => id !== 'base1-58')]
  const frozen = Object.freeze([...ids])
  assert.deepEqual(validatePracticeTeam(frozen), { valid: true, cardIds: ids })
  const source = Object.freeze(transfer(frozen))
  const result = readPracticeTeamTransfer(source)
  assert.deepEqual(result, { kind: 'ready', cardIds: ids })
  if (result.kind !== 'ready') throw Error('expected ready')
  const session = createPractice('from-team', result.cardIds)
  assert.deepEqual(
    session.battle.sides[0].fighters.map((f) => f.id),
    ids,
  )
  assert.equal(session.battle.sides[0].fighters[0].speciesId, 25)
  result.cardIds.reverse()
  assert.deepEqual(frozen, ids)
  assert.deepEqual(readPracticeTeamTransfer(source), { kind: 'ready', cardIds: ids })
})

test('reports missing slots and each unsupported exact ID without substituting an illustration', () => {
  assert.deepEqual(validatePracticeTeam([]), {
    valid: false,
    issues: [{ code: 'team-size', count: 0 }],
  })
  const ids = ['base1-90', 'unknown-variant', ...DEFAULT_PLAYER.slice(2)]
  assert.deepEqual(validatePracticeTeam(ids), {
    valid: false,
    issues: [
      { code: 'unplayable-card', slot: 0, cardId: 'base1-90' },
      { code: 'unplayable-card', slot: 1, cardId: 'unknown-variant' },
    ],
  })
  const partial = readPracticeTeamTransfer(transfer(ids.slice(0, 2)))
  assert.equal(partial.kind, 'invalid')
  if (partial.kind !== 'invalid') throw Error('expected invalid')
  assert.deepEqual(partial.issues, [
    { code: 'team-size', count: 2 },
    { code: 'unplayable-card', slot: 0, cardId: 'base1-90' },
    { code: 'unplayable-card', slot: 1, cardId: 'unknown-variant' },
  ])
})

test('rejects repeated IDs or different illustrations of the same species', () => {
  const alternate = listPlayableCards().find(
    (c) => c.speciesId === 1 && c.id !== DEFAULT_PLAYER[0],
  )!
  for (const duplicate of [DEFAULT_PLAYER[0], alternate.id]) {
    const ids = [DEFAULT_PLAYER[0], duplicate, ...DEFAULT_PLAYER.slice(2)]
    assert.deepEqual(validatePracticeTeam(ids), {
      valid: false,
      issues: [{ code: 'duplicate-species', slot: 1, cardId: duplicate }],
    })
  }
})

test('distinguishes direct entry from malformed, sparse or incompatible navigation data', () => {
  for (const value of [null, undefined])
    assert.deepEqual(readPracticeTeamTransfer(value), { kind: 'none' })
  for (const value of [
    null,
    {},
    'base1-44',
    [...DEFAULT_PLAYER, 'base2-51'],
    new Array(6),
    [1, ...DEFAULT_PLAYER.slice(1)],
    ['x'.repeat(201), ...DEFAULT_PLAYER.slice(1)],
  ])
    assert.equal(validatePracticeTeam(value).valid, false)
  for (const value of [
    false,
    {},
    [],
    { ...transfer(DEFAULT_PLAYER), version: 2 },
    { ...transfer(DEFAULT_PLAYER), kind: 'other' },
    transfer(new Array(6)),
  ])
    assert.equal(readPracticeTeamTransfer(value).kind, 'invalid')
})

test('practice edits, tutorial and reload of the transfer do not write or alter the saved draft', async () => {
  const ids = [...DEFAULT_PLAYER].reverse()
  const cards = ids.map((id) => (artwork as unknown as CardRecord[]).find((c) => c.id === id)!)
  let raw = ''
  let writes = 0
  const storage = () => ({
    getItem: () => raw || null,
    setItem: (_key: string, value: string) => {
      raw = value
      writes++
    },
  })
  assert.equal(saveTeamDraft(cards, storage), 'saved')
  const before = raw
  const read = readTeamDraft(storage)
  if (read.kind !== 'ready') throw Error('expected saved draft')
  const restored = await restoreTeamDraft(read.draft, {
    load: async () => ({ species: cards.map((c) => ({ id: c.speciesIds[0] })) as SpeciesRecord[] }),
    listVariants: async (id) => cards.filter((c) => c.speciesIds[0] === id),
  })
  const serialized = JSON.stringify(transfer(restored.map((c) => c.id)))
  const incoming = readPracticeTeamTransfer(JSON.parse(serialized))
  if (incoming.kind !== 'ready') throw Error('expected valid transfer')
  const practice = createPractice('practice', incoming.cardIds)
  practiceReducer(practice, {
    kind: 'turn',
    battleId: 'practice',
    expectedVersion: 1,
    action: { kind: 'pass' },
    tieBreak: 0,
  })
  const tutorial = createPractice('tutorial', incoming.cardIds, true)
  assert.notDeepEqual(
    tutorial.battle.sides[0].fighters.map((f) => f.id),
    ids,
  )
  const changed = [...incoming.cardIds]
  changed[0] = listPlayableCards().find(
    (c) => c.speciesId === getPlayableCard(changed[0])!.speciesId && c.id !== changed[0],
  )!.id
  createPractice('edited', changed)
  assert.deepEqual(readPracticeTeamTransfer(JSON.parse(serialized)), {
    kind: 'ready',
    cardIds: ids,
  })
  assert.equal(raw, before)
  assert.equal(writes, 1)
})
