import test from 'node:test'
import assert from 'node:assert/strict'
import { activeFighter } from './battle-state.ts'
import { createPractice, practiceReducer, DEFAULT_PLAYER } from './practice.ts'
import { buildPlaybackFrames } from './playback.ts'
import { resolveTurn } from './turn-engine.ts'
import type { BattleAction } from './engine-types.ts'

const ids = ['base1-90', 'base1-82', 'base1-80']
function setup(supports: readonly string[] = ids) {
  return createPractice('supports', DEFAULT_PLAYER, false, 'balanced', supports)
}
function supportAction(id: string, actorId: string = DEFAULT_PLAYER[0]): BattleAction {
  return { kind: 'support', actorId, supportId: id }
}

test('practice equips only explicitly mapped cards, with three distinct supports at most', () => {
  const session = setup()
  assert.deepEqual(session.battle.sides[0].supports, [
    { id: ids[0], effect: 'heal', used: false },
    { id: ids[1], effect: 'cleanse', used: false },
    { id: ids[2], effect: 'barrier', used: false },
  ])
  assert.deepEqual(session.battle.sides[1].supports, [])
  assert.deepEqual(setup([]).battle.sides[0].supports, [])
  for (const invalid of [[...ids, 'base1-96'], [ids[0], ids[0]], ['base1-91'], [DEFAULT_PLAYER[0]]])
    assert.throws(() => setup(invalid))
  assert.notEqual(session.battle.dataVersion, setup([]).battle.dataVersion)
})

test('mapped healing consumes the turn once, before the committed bot attack, without mutating input', () => {
  const session = setup()
  activeFighter(session.battle, 0).hp -= 100
  const original = structuredClone(session)
  const command = {
    kind: 'turn' as const,
    battleId: 'supports',
    expectedVersion: 1,
    action: supportAction(ids[0]),
    tieBreak: 0 as const,
  }
  const next = practiceReducer(session, command)!
  const events = next.rounds[0].events
  const heal = events.find((e) => e.kind === 'support')!
  assert.equal(heal.kind, 'support')
  if (heal.kind === 'support')
    assert.equal(heal.healed, Math.floor(activeFighter(session.battle, 0).maxHp * 0.3))
  assert.ok(
    events.findIndex((e) => e.kind === 'support') < events.findIndex((e) => e.kind === 'move'),
  )
  assert.equal(
    events.some((e) => e.kind === 'move' && e.side === 0),
    false,
  )
  assert.equal(next.battle.sides[0].supports[0].used, true)
  assert.equal(practiceReducer(next, command), next)
  assert.deepEqual(session, original)
  assert.throws(() =>
    resolveTurn(next.battle, [supportAction(ids[0]), { kind: 'pass' }], next.battle.version, 0),
  )
})

test('invalid supports do not consume anything; cleansing works while asleep', () => {
  const session = setup()
  const before = structuredClone(session.battle)
  for (const id of ids.slice(0, 2))
    assert.throws(() => resolveTurn(session.battle, [supportAction(id), { kind: 'pass' }], 1, 0))
  assert.deepEqual(session.battle, before)
  activeFighter(session.battle, 0).status = 'sleep'
  const next = resolveTurn(session.battle, [supportAction(ids[1]), { kind: 'pass' }], 1, 0)
  assert.equal(activeFighter(next.state, 0).status, null)
  assert.equal(next.state.sides[0].supports[1].used, true)
  assert.equal(
    next.events.some((e) => e.kind === 'blocked'),
    false,
  )
})

test('tutorial has no supports; a new match restores the selected cards as unused', () => {
  const session = setup(['base1-96'])
  const played = practiceReducer(session, {
    kind: 'turn',
    battleId: 'supports',
    expectedVersion: 1,
    action: supportAction('base1-96'),
    tieBreak: 0,
  })!
  const rematch = practiceReducer(played, {
    kind: 'start',
    battleId: 'rematch',
    playerIds: DEFAULT_PLAYER,
    opponentId: 'balanced',
    supportIds: played.battle.sides[0].supports.map((s) => s.id),
  })!
  assert.equal(rematch.battle.sides[0].supports[0].used, false)
  assert.equal(activeFighter(rematch.battle, 0).boost, null)
  const tutorial = createPractice('tutorial', [], true, 'elite', ids)
  assert.deepEqual(tutorial.battle.sides[0].supports, [])
  assert.equal(tutorial.opponentId, 'balanced')
})

test('playback shows support consumption and modifiers before attacks and clears them on switch', () => {
  let state = setup(['base1-96', 'base1-80']).battle
  for (const id of ['base1-96', 'base1-80']) {
    const next = resolveTurn(state, [supportAction(id), { kind: 'pass' }], state.version, 0)
    const frame = buildPlaybackFrames(state, next.state, next.events).find(
      (f) => f.event?.kind === 'support',
    )!
    assert.equal(frame.battle.sides[0].supports.find((s) => s.id === id)!.used, true)
    if (id === 'base1-96')
      assert.deepEqual(activeFighter(frame.battle, 0).boost, { charges: 2, expiresAfter: 3 })
    else assert.equal(activeFighter(frame.battle, 0).barrierUntil, 3)
    state = next.state
  }
  const next = resolveTurn(
    state,
    [{ kind: 'switch', actorId: DEFAULT_PLAYER[0], targetId: DEFAULT_PLAYER[1] }, { kind: 'pass' }],
    state.version,
    0,
  )
  const frame = buildPlaybackFrames(state, next.state, next.events).find(
    (f) => f.event?.kind === 'switch',
  )!
  assert.equal(frame.battle.sides[0].fighters[0].boost, null)
  assert.equal(frame.battle.sides[0].fighters[0].barrierUntil, null)
})

import { readFileSync } from 'node:fs'
import { listPlayableSupports, supportUnavailable } from './supports.ts'
import { validateAction } from './battle-state.ts'
import type { CardRecord } from '../catalog/types.ts'

test('mapped support artwork exactly matches the pinned catalog and retains its real language', () => {
  const catalog: CardRecord[] = JSON.parse(
    readFileSync('public/catalog/snapshots/523febef1a683029/support.json', 'utf8'),
  )
  const artwork: CardRecord[] = JSON.parse(
    readFileSync('src/features/practice/support-artwork.json', 'utf8'),
  )
  const supported = listPlayableSupports()
  assert.deepEqual(
    artwork.map((c) => c.id),
    supported.map((s) => s.id),
  )
  for (const card of artwork) {
    assert.deepEqual(
      card,
      catalog.find((c) => c.id === card.id),
    )
    assert.equal(card.mapping, 'support')
    assert.ok(card.category === 'Trainer' || card.category === 'Energy')
    assert.ok(card.localizations.en?.imageUrl)
  }
  supported[0] = { id: 'wrong', effect: 'boost' }
  assert.equal(listPlayableSupports()[0].id, 'base1-90')
})

test('support availability agrees with the engine, including phase, HP, status and consumed cards', () => {
  for (const definition of listPlayableSupports()) {
    for (const scenario of [
      'initial',
      'injured',
      'asleep',
      'frozen',
      'used',
      'buffed',
      'replacement',
      'finished',
    ]) {
      const state = setup([definition.id]).battle
      const actor = activeFighter(state, 0)
      if (scenario === 'injured') actor.hp -= 50
      if (scenario === 'asleep') actor.status = 'sleep'
      if (scenario === 'frozen') actor.status = 'freeze'
      if (scenario === 'used') state.sides[0].supports[0].used = true
      if (scenario === 'buffed') {
        actor.boost = { charges: 2, expiresAfter: 3 }
        actor.barrierUntil = 2
      }
      if (scenario === 'replacement' || scenario === 'finished') state.phase = scenario
      let valid = true
      try {
        validateAction(state, 0, supportAction(definition.id))
      } catch {
        valid = false
      }
      assert.equal(
        supportUnavailable(state, 0, definition.id) === null,
        valid,
        definition.id + scenario,
      )
    }
  }
  assert.equal(supportUnavailable(setup().battle, 0, ids[0]), 'fullHp')
  assert.equal(supportUnavailable(setup().battle, 0, ids[1]), 'noStatus')
})

test('playback decrements boost on executed attacks and reflects barrier expiry and KO', () => {
  let state = setup(['base1-96', 'base1-80']).battle
  let next = resolveTurn(state, [supportAction('base1-96'), { kind: 'pass' }], state.version, 0)
  state = next.state
  const actor = activeFighter(state, 0)
  const move = actor.moves.find((m) => m.kind === 'damage' && m.cooldown === 0)!
  next = resolveTurn(
    state,
    [{ kind: 'move', actorId: actor.id, moveId: move.id }, { kind: 'pass' }],
    state.version,
    0,
  )
  let frames = buildPlaybackFrames(state, next.state, next.events)
  assert.equal(
    activeFighter(frames.find((f) => f.event?.kind === 'move')!.battle, 0).boost?.charges,
    1,
  )
  state = next.state
  next = resolveTurn(state, [{ kind: 'pass' }, { kind: 'pass' }], state.version, 0)
  frames = buildPlaybackFrames(state, next.state, next.events)
  assert.equal(
    activeFighter(frames.find((f) => f.event?.kind === 'expired')!.battle, 0).boost,
    null,
  )
  state = setup(['base1-80']).battle
  next = resolveTurn(state, [supportAction('base1-80'), { kind: 'pass' }], state.version, 0)
  state = next.state
  next = resolveTurn(state, [{ kind: 'pass' }, { kind: 'pass' }], state.version, 0)
  frames = buildPlaybackFrames(state, next.state, next.events)
  assert.equal(
    activeFighter(frames.find((f) => f.event?.kind === 'expired')!.battle, 0).barrierUntil,
    null,
  )
  state = setup(['base1-80']).battle
  activeFighter(state, 0).hp = 1
  const enemy = activeFighter(state, 1)
  next = resolveTurn(
    state,
    [
      supportAction('base1-80'),
      { kind: 'move', actorId: enemy.id, moveId: enemy.moves.find((m) => m.kind === 'damage')!.id },
    ],
    state.version,
    0,
  )
  frames = buildPlaybackFrames(state, next.state, next.events)
  assert.equal(
    activeFighter(frames.find((f) => f.event?.kind === 'faint')!.battle, 0).barrierUntil,
    null,
  )
})

test('practice with supports reaches a result against both policies and rematches with fresh uses', () => {
  for (const opponentId of ['balanced', 'elite'] as const) {
    let session = createPractice('complete', DEFAULT_PLAYER, false, opponentId, [
      'base1-90',
      'base1-80',
      'base1-96',
    ])
    let transitions = 0
    while (session.battle.phase !== 'finished' && transitions++ < 100) {
      const state = session.battle
      const common = { battleId: state.battleId, expectedVersion: state.version }
      if (state.phase === 'replacement') {
        session = practiceReducer(session, {
          ...common,
          kind: 'replace',
          targetId: state.sides[0].fighters.find((f) => f.hp > 0)!.id,
        })!
        continue
      }
      const actor = activeFighter(state, 0)
      const support = state.sides[0].supports.find(
        (s) => supportUnavailable(state, 0, s.id) === null,
      )
      const move = actor.moves.find((m) => actor.readyOn[m.id] <= state.turn)
      const action: BattleAction = support
        ? supportAction(support.id, actor.id)
        : move
          ? { kind: 'move', actorId: actor.id, moveId: move.id }
          : { kind: 'pass' }
      session = practiceReducer(session, { ...common, kind: 'turn', action, tieBreak: 0 })!
      for (const side of session.battle.sides)
        for (const f of side.fighters) assert.ok(f.hp >= 0 && f.hp <= f.maxHp)
    }
    assert.equal(session.battle.phase, 'finished')
    assert.ok(session.rounds.some((r) => r.events.some((e) => e.kind === 'support')))
    const rematch = practiceReducer(session, {
      kind: 'start',
      battleId: 'new',
      playerIds: session.battle.sides[0].fighters.map((f) => f.id),
      opponentId: session.opponentId,
      supportIds: session.battle.sides[0].supports.map((s) => s.id),
    })!
    assert.equal(rematch.opponentId, opponentId)
    assert.equal(rematch.battle.turn, 1)
    assert.equal(rematch.battle.sides[0].supports.length, 3)
    assert.ok(rematch.battle.sides[0].supports.every((s) => !s.used))
  }
})
