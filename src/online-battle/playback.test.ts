import { test } from 'node:test'
import assert from 'node:assert/strict'
import { updatePlayback } from './playback.ts'
import { createPractice, practiceReducer } from '../battle/practice.ts'
import type { OnlineMatch } from './protocol.ts'
const raw = createPractice(
  'bb200000-0000-4000-8000-000000000001',
  undefined,
  false,
  'rookie',
  [],
  [],
)
const match = (session = raw, revision = 0): OnlineMatch => ({
  id: session.battle.battleId,
  revision,
  status: 'active',
  reward: 0,
  session: { battle: session.battle, rounds: session.rounds, opponentId: session.opponentId },
})
test('server presentation animates only consecutive revisions and never replays a reload or duplicate', () => {
  const first = updatePlayback(null, match())
  assert.equal(first.frames.length, 0)
  const next = practiceReducer(raw, {
    kind: 'turn',
    battleId: raw.battle.battleId,
    expectedVersion: 0,
    action: { kind: 'pass' },
    tieBreak: 0,
  })!
  const playing = updatePlayback(first, match(next, 1))
  assert.ok(playing.frames.length > 0)
  assert.equal(updatePlayback(playing, match(next, 1)).frames, playing.frames)
  assert.equal(updatePlayback(null, match(next, 1)).frames.length, 0)
  assert.equal(updatePlayback(first, match(next, 3)).frames.length, 0)
})

test('empty account view always has a playable presentation container', () => {
  const empty = updatePlayback(null, null)
  assert.deepEqual(empty.frames, [])
  assert.equal(empty.cursor, 0)
})
