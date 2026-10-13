import test from 'node:test'
import assert from 'node:assert/strict'
import { activeFighter } from './battle-state.ts'
import { DEFAULT_PLAYER, createPractice, practiceReducer } from './practice.ts'
import { buildPlaybackFrames, createPresentation, presentationReducer } from './playback.ts'
import type { PracticeSession } from './practice.ts'
function resolve(s: PracticeSession) {
  const p = activeFighter(s.battle, 0)
  return practiceReducer(s, {
    kind: 'turn',
    battleId: s.battle.battleId,
    expectedVersion: s.battle.version,
    action: { kind: 'move', actorId: p.id, moveId: p.moves.find((m) => m.kind === 'damage')!.id },
    tieBreak: 0,
  })!
}
test('frames preserve move order and HP changes only at damage, ending exactly at engine state', () => {
  const s = createPractice('frames'),
    before = structuredClone(s),
    next = resolve(s)
  const events = next.rounds[0].events,
    frames = buildPlaybackFrames(s.battle, next.battle, events)
  assert.deepEqual(
    frames.filter((f) => f.event?.kind === 'move').map((f) => f.event),
    events.filter((e) => e.kind === 'move'),
  )
  const first = frames.find((f) => f.event?.kind === 'move')!
  assert.equal(activeFighter(first.battle, 0).hp, activeFighter(s.battle, 0).hp)
  for (const f of frames) {
    const event = f.event
    if (event?.kind === 'damage')
      assert.equal(
        f.battle.sides[event.side].fighters.find((x) => x.id === event.targetId)!.hp,
        event.remainingHp,
      )
  }
  assert.deepEqual(frames.at(-1)!.battle, next.battle)
  assert.deepEqual(s, before)
})
test('bot faint is shown before automatic replacement; no cry or attack for a blocked actor', () => {
  const s = createPractice('faint')
  activeFighter(s.battle, 1).hp = 1
  s.botAction = { kind: 'pass' }
  const next = resolve(s),
    frames = buildPlaybackFrames(s.battle, next.battle, next.rounds[0].events)
  const faint = frames.find((f) => f.event?.kind === 'faint')!
  assert.equal(activeFighter(faint.battle, 1).id, activeFighter(s.battle, 1).id)
  assert.equal(activeFighter(faint.battle, 1).hp, 0)
  const switched = frames.find((f) => f.event?.kind === 'switch')!
  assert.notEqual(activeFighter(switched.battle, 1).id, activeFighter(s.battle, 1).id)
  const sleeping = createPractice('sleep')
  activeFighter(sleeping.battle, 0).status = 'sleep'
  const after = resolve(sleeping),
    blocked = buildPlaybackFrames(sleeping.battle, after.battle, after.rounds[0].events)
  assert.equal(
    blocked.some((f) => f.event?.kind === 'move' && f.event.side === 0),
    false,
  )
  assert.ok(blocked.some((f) => f.event?.kind === 'blocked'))
})
test('zero damage stays zero and immunity is not represented as a damaging hit', () => {
  const s = createPractice('immune')
  const before = s.battle
  const target = activeFighter(before, 1)
  const frames = buildPlaybackFrames(before, before, [
    {
      kind: 'damage',
      side: 1,
      targetId: target.id,
      source: 'move',
      amount: 0,
      remainingHp: target.hp,
    },
  ])
  assert.equal(frames[0].event?.kind, 'damage')
  assert.equal(activeFighter(frames[0].battle, 1).hp, target.hp)
  assert.deepEqual(frames.at(-1)!.battle, before)
})
test('playback locks commands and skip settles exactly once; stale timers cannot skip another frame or match', () => {
  const init = presentationReducer(createPresentation(), {
    kind: 'start',
    battleId: 'one',
    playerIds: DEFAULT_PLAYER,
  })
  const cmd = {
    kind: 'turn' as const,
    battleId: 'one',
    expectedVersion: 1,
    action: { kind: 'pass' as const },
    tieBreak: 0 as const,
  }
  const playing = presentationReducer(init, cmd)
  assert.ok(playing.frames.length > 0)
  assert.equal(presentationReducer(playing, cmd), playing)
  const tick = {
    kind: 'tick' as const,
    battleId: 'one',
    expectedVersion: playing.session!.battle.version,
    cursor: 0,
  }
  const moved = presentationReducer(playing, tick)
  assert.equal(presentationReducer(moved, tick), moved)
  const skipped = presentationReducer(moved, { ...tick, kind: 'skip', cursor: moved.cursor })
  assert.equal(skipped.frames.length, 0)
  assert.deepEqual(skipped.session, playing.session)
  const fresh = presentationReducer(playing, {
    kind: 'start',
    battleId: 'two',
    playerIds: DEFAULT_PLAYER,
  })
  assert.equal(presentationReducer(fresh, tick), fresh)
  assert.equal(fresh.frames.length, 0)
})
test('exit cancels presentation and clears the match', () => {
  let state = presentationReducer(createPresentation(), {
    kind: 'start',
    battleId: 'exit',
    playerIds: DEFAULT_PLAYER,
  })
  state = presentationReducer(state, {
    kind: 'turn',
    battleId: 'exit',
    expectedVersion: 1,
    action: { kind: 'pass' },
    tieBreak: 0,
  })
  const end = presentationReducer(state, {
    kind: 'exit',
    battleId: 'exit',
    expectedVersion: state.session!.battle.version,
  })
  assert.equal(end.session, null)
  assert.equal(end.frames.length, 0)
})
