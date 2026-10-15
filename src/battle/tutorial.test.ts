import test from 'node:test'
import assert from 'node:assert/strict'
import { practiceReducer, createPractice, DEFAULT_PLAYER } from './practice.ts'
import type { PracticeSession } from './practice.ts'
import { activeFighter, validateAction } from './battle-state.ts'
import { resolveTurn } from './turn-engine.ts'
import { presentationReducer, createPresentation } from './playback.ts'
import { tutorialAction, advanceTutorial } from './tutorial.ts'
import type { TutorialStep } from './tutorial.ts'
function start(id = 'lesson') {
  return practiceReducer(null, { kind: 'start', battleId: id, playerIds: [], tutorial: true })!
}
function guide(
  s: PracticeSession,
  action: 'next' | 'dismiss',
  expectedStep: TutorialStep = s.tutorial!,
) {
  return {
    kind: 'guide' as const,
    battleId: s.battle.battleId,
    expectedVersion: s.battle.version,
    expectedStep,
    action,
  }
}
function command(s: PracticeSession) {
  return {
    kind: 'turn' as const,
    battleId: s.battle.battleId,
    expectedVersion: s.battle.version,
    action: tutorialAction(s.battle, s.tutorial)!,
    tieBreak: 0 as const,
  }
}
test('tutorial starts a valid fixed six-card lesson without touching the user team', () => {
  const team = [...DEFAULT_PLAYER],
    copy = [...team]
  const s = practiceReducer(null, {
    kind: 'start',
    battleId: 'lesson',
    playerIds: team,
    tutorial: true,
  })!
  assert.equal(s.tutorial, 'welcome')
  assert.equal(activeFighter(s.battle, 0).speciesId, 25)
  assert.equal(new Set(s.battle.sides[0].fighters.map((f) => f.speciesId)).size, 6)
  assert.deepEqual(team, copy)
  assert.equal(createPractice('free').tutorial, null)
})
test('complete lesson applies real damage, cooldown, switch and sleep using the unchanged engine', () => {
  let s = start()
  const first = s.battle
  s = practiceReducer(s, guide(s, 'next'))!
  assert.equal(s.tutorial, 'attack')
  assert.equal(s.battle, first)
  for (const [from, to] of [
    ['attack', 'types'],
    ['switch', 'status'],
    ['status', 'complete'],
  ] as const) {
    assert.equal(s.tutorial, from)
    const cmd = command(s)
    validateAction(s.battle, 0, cmd.action)
    const expected = resolveTurn(s.battle, [cmd.action, s.botAction!], s.battle.version, 0)
    const before = structuredClone(s)
    s = practiceReducer(s, cmd)!
    assert.deepEqual(s.battle, expected.state)
    assert.equal(s.tutorial, to)
    assert.equal(s.battle.phase, 'selection')
    if (from === 'attack') {
      assert.ok(activeFighter(s.battle, 1).hp < activeFighter(before.battle, 1).hp)
      assert.ok(activeFighter(s.battle, 0).readyOn['pokeapi-85'] > s.battle.turn)
      const unchanged = s.battle
      s = practiceReducer(s, guide(s, 'next'))!
      assert.equal(s.battle, unchanged)
    }
    if (from === 'switch') assert.equal(activeFighter(s.battle, 0).speciesId, 39)
  }
  assert.equal(activeFighter(s.battle, 1).status, 'sleep')
  assert.equal(s.battle.result, null)
  const finished = s
  s = practiceReducer(s, guide(s, 'dismiss'))!
  assert.equal(s.tutorial, null)
  assert.equal(s.battle, finished.battle)
  assert.equal(s.botAction, finished.botAction)
  const cmd = { ...command(finished), action: { kind: 'pass' as const } }
  const next = practiceReducer(s, cmd)!
  assert.ok(
    next.rounds
      .at(-1)!
      .events.some((e) => e.kind === 'blocked' && e.side === 1 && e.reason === 'sleep'),
  )
})
test('guide rejects out-of-order actions and advances only on matching engine events', () => {
  let s = start()
  const pass = {
    kind: 'turn' as const,
    battleId: s.battle.battleId,
    expectedVersion: s.battle.version,
    action: { kind: 'pass' as const },
    tieBreak: 0 as const,
  }
  assert.equal(practiceReducer(s, pass), s)
  s = practiceReducer(s, guide(s, 'next'))!
  assert.equal(practiceReducer(s, pass), s)
  const actual = command(s)
  assert.equal(
    practiceReducer(s, {
      ...actual,
      action: {
        kind: 'move',
        actorId: actual.action.kind === 'move' ? actual.action.actorId : '',
        moveId: 'pokeapi-84',
      },
    }),
    s,
  )
  assert.equal(advanceTutorial('attack', s.battle, []), 'attack')
  assert.equal(
    advanceTutorial('status', s.battle, [
      {
        kind: 'status',
        side: 1,
        targetId: activeFighter(s.battle, 1).id,
        status: 'sleep',
        outcome: 'immune',
      },
    ]),
    'status',
  )
})
test('stale guide commands, duplicate clicks and a new match cannot skip a lesson', () => {
  const s = start(),
    next = guide(s, 'next')
  const attack = practiceReducer(s, next)!
  assert.equal(practiceReducer(attack, next), attack)
  assert.equal(practiceReducer(attack, guide(attack, 'next')), attack)
  const fresh = start('new')
  assert.equal(practiceReducer(fresh, next), fresh)
  const after = practiceReducer(attack, command(attack))!
  assert.equal(practiceReducer(after, guide(attack, 'dismiss')), after)
})
test('dismiss works at every stage without healing, advancing a turn or changing bot intent', () => {
  let s = start()
  for (const stage of ['welcome', 'attack', 'types', 'switch', 'status', 'complete'] as const) {
    const current = { ...s, tutorial: stage }
    const dismissed = practiceReducer(current, guide(current, 'dismiss'))!
    assert.equal(dismissed.tutorial, null)
    assert.equal(dismissed.battle, current.battle)
    assert.equal(dismissed.rounds, current.rounds)
    assert.equal(dismissed.botAction, current.botAction)
  }
  s = practiceReducer(s, guide(s, 'dismiss'))!
  assert.notEqual(
    practiceReducer(s, {
      kind: 'turn',
      battleId: 'lesson',
      expectedVersion: 1,
      action: { kind: 'pass' },
      tieBreak: 0,
    }),
    s,
  )
})
test('presentation waits for playback; skip preserves lesson and exit/restart clears it', () => {
  let p = presentationReducer(createPresentation(), {
    kind: 'start',
    battleId: 'ui',
    playerIds: [],
    tutorial: true,
  })
  p = presentationReducer(p, guide(p.session!, 'next'))
  assert.equal(p.frames.length, 0)
  p = presentationReducer(p, command(p.session!))
  assert.ok(p.frames.length > 0)
  assert.equal(p.session!.tutorial, 'types')
  assert.equal(presentationReducer(p, guide(p.session!, 'next')), p)
  const skipped = presentationReducer(p, {
    kind: 'skip',
    battleId: 'ui',
    expectedVersion: p.session!.battle.version,
    cursor: p.cursor,
  })
  assert.equal(skipped.session, p.session)
  assert.equal(skipped.frames.length, 0)
  const exited = presentationReducer(skipped, {
    kind: 'exit',
    battleId: 'ui',
    expectedVersion: skipped.session!.battle.version,
  })
  assert.equal(exited.session, null)
  const normal = presentationReducer(p, {
    kind: 'start',
    battleId: 'normal',
    playerIds: DEFAULT_PLAYER,
  })
  assert.equal(normal.session!.tutorial, null)
  assert.equal(normal.frames.length, 0)
})
