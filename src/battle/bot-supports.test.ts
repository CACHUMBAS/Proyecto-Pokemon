import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseBotAction, chooseTacticalBotAction } from './bot.ts'
import { activeFighter, validateAction } from './battle-state.ts'
import { createPlayableBattle } from './playable-roster.ts'
import { createPractice, practiceReducer, DEFAULT_PLAYER, DEFAULT_BOT } from './practice.ts'
import { getPracticeOpponent } from './opponents.ts'
import { resolveTurn } from './turn-engine.ts'
import { buildPlaybackFrames } from './playback.ts'
import type { BattleState, BattleAction } from './engine-types.ts'

function board(
  supports: string[],
  player: string[] = [...DEFAULT_PLAYER],
  bot: string[] = [...DEFAULT_BOT],
) {
  return createPlayableBattle('supports-bot', [player, bot], [[], supports])
}
function chosen(state: BattleState, id: string) {
  assert.deepEqual(chooseBotAction(state), {
    kind: 'support',
    actorId: activeFighter(state, 1).id,
    supportId: id,
  })
}

test('rivals equip visible distinct mapped kits, while tutorial and its rematch have none', () => {
  const kits = {
    rookie: ['base1-90'],
    balanced: ['base1-90', 'base1-82'],
    elite: ['base1-90', 'base1-80', 'base1-96'],
  }
  for (const [id, kit] of Object.entries(kits)) {
    assert.deepEqual(getPracticeOpponent(id).supportIds, kit)
    assert.deepEqual(
      createPractice(id, DEFAULT_PLAYER, false, id).battle.sides[1].supports.map((s) => s.id),
      kit,
    )
  }
  const tutorial = createPractice('tutorial', [], true, 'elite', ['base1-96'])
  const dismissed = practiceReducer(tutorial, {
    kind: 'guide',
    battleId: 'tutorial',
    expectedVersion: 1,
    expectedStep: 'welcome',
    action: 'dismiss',
  })!
  const rematch = practiceReducer(dismissed, {
    kind: 'start',
    battleId: 'rematch',
    playerIds: dismissed.battle.sides[0].fighters.map((f) => f.id),
    opponentId: dismissed.opponentId,
    supportIds: [],
    opponentSupportIds: dismissed.battle.sides[1].supports.map((s) => s.id),
  })!
  for (const s of [tutorial, dismissed, rematch]) {
    assert.deepEqual(
      s.battle.sides.map((side) => side.supports),
      [[], []],
    )
    assert.equal(s.opponentId, 'balanced')
  }
})

test('heals an injured survivor and cleanses statuses, but rejects full HP and spent cards', () => {
  const state = board(['base1-90', 'base1-82'])
  const actor = activeFighter(state, 1)
  actor.hp = 90
  chosen(state, 'base1-90')
  state.sides[1].supports[0].used = true
  for (const status of ['burn', 'poison', 'paralysis', 'sleep', 'freeze'] as const) {
    actor.hp = actor.maxHp
    actor.status = status
    chosen(state, 'base1-82')
  }
  actor.status = null
  assert.notEqual(chooseBotAction(state).kind, 'support')
})

test('uses barrier against meaningful damage and boost only when it can survive and damage later', () => {
  const barrier = board(['base1-80'])
  chosen(barrier, 'base1-80')
  const boost = board(['base1-96'])
  chosen(boost, 'base1-96')
  activeFighter(boost, 1).status = 'sleep'
  assert.notEqual(chooseBotAction(boost).kind, 'support')
  activeFighter(boost, 1).status = null
  activeFighter(boost, 1).hp = 1
  assert.notEqual(chooseBotAction(boost).kind, 'support')
  const immune = board(
    ['base1-96'],
    ['base1-50', ...DEFAULT_PLAYER.slice(0, 5)],
    ['base2-51', ...DEFAULT_BOT.filter((id) => id !== 'base2-51')],
  )
  assert.notEqual(chooseBotAction(immune).kind, 'support')
  for (const turn of [59, 60]) {
    const late = board(['base1-96'])
    late.turn = turn
    assert.notEqual(chooseBotAction(late).kind, 'support')
  }
})

test('keeps a safe knockout or tactical retreat instead of spending a support', () => {
  const state = board(['base1-90', 'base1-80', 'base1-96'])
  activeFighter(state, 0).hp = 1
  activeFighter(state, 0).status = 'paralysis'
  activeFighter(state, 1).hp = 90
  assert.equal(chooseBotAction(state).kind, 'move')
  const electric = ['base1-58', ...DEFAULT_PLAYER.filter((id) => id !== 'base1-58')]
  const elite = createPractice('retreat', electric, false, 'elite')
  assert.equal(chooseTacticalBotAction(elite.battle).kind, 'switch')
})

test('support choice is deterministic, immutable, precommitted and projected before the player attack', () => {
  let session = createPractice('committed', [
    'base2-54',
    ...DEFAULT_PLAYER.filter((id) => id !== 'base2-54'),
  ])
  // Two basic attacks leave both active fighters alive and Abra eligible for recovery.
  const actor = activeFighter(session.battle, 0)
  for (let i = 0; i < 2; i++)
    session = practiceReducer(session, {
      kind: 'turn',
      battleId: 'committed',
      expectedVersion: session.battle.version,
      action: { kind: 'move', actorId: actor.id, moveId: 'pokeapi-1' },
      tieBreak: 0,
    })!
  assert.equal(session.botAction!.kind, 'support')
  const before = structuredClone(session)
  for (const action of [
    { kind: 'pass' },
    { kind: 'move', actorId: actor.id, moveId: 'pokeapi-1' },
    { kind: 'switch', actorId: actor.id, targetId: DEFAULT_PLAYER[1] },
  ] as BattleAction[]) {
    const next = practiceReducer(session, {
      kind: 'turn',
      battleId: 'committed',
      expectedVersion: session.battle.version,
      action,
      tieBreak: 0,
    })!
    const events = next.rounds.at(-1)!.events
    const event = events.find((e) => e.kind === 'support' && e.side === 1)!
    assert.equal(event.kind, 'support')
    const frames = buildPlaybackFrames(session.battle, next.battle, events)
    const frame = frames.find((f) => f.event?.kind === 'support')!
    assert.equal(
      frame.battle.sides[1].supports.find(
        (s) => s.id === (event.kind === 'support' ? event.supportId : ''),
      )!.used,
      true,
    )
    assert.equal(
      events.some((e) => e.kind === 'move' && e.side === 1),
      false,
    )
    assert.deepEqual(
      practiceReducer(session, {
        kind: 'turn',
        battleId: 'committed',
        expectedVersion: session.battle.version,
        action,
        tieBreak: 0,
      }),
      next,
    )
  }
  assert.deepEqual(session, before)
  validateAction(session.battle, 1, chooseBotAction(session.battle))
})

test('does not spend doomed or late supports and leaves frozen battle inputs unchanged', () => {
  const doomed = board(['base1-90', 'base1-80', 'base1-96'])
  activeFighter(doomed, 1).hp = 1
  assert.notEqual(chooseBotAction(doomed).kind, 'support')
  const last = board(['base1-90', 'base1-82'])
  last.turn = 60
  activeFighter(last, 1).hp = 90
  activeFighter(last, 1).status = 'burn'
  assert.notEqual(chooseBotAction(last).kind, 'support')
  const state = board(['base1-90', 'base1-82'])
  activeFighter(state, 1).hp = 90
  const before = structuredClone(state)
  function freeze(value: object) {
    for (const item of Object.values(value)) if (item && typeof item === 'object') freeze(item)
    Object.freeze(value)
  }
  freeze(state)
  const action = chooseBotAction(state)
  assert.deepEqual(chooseBotAction(state), action)
  const result = resolveTurn(state, [{ kind: 'pass' }, action], state.version, 0)
  assert.equal(result.state.sides[1].supports[0].used, true)
  assert.deepEqual(state, before)
})

test('all rival kits complete matches, consume each card at most once and reset on rematch', () => {
  let totalSupports = 0
  for (const opponentId of ['rookie', 'balanced', 'elite'] as const) {
    let session = createPractice('complete-' + opponentId, DEFAULT_PLAYER, false, opponentId, [
      'base1-90',
      'base1-80',
      'base1-96',
    ])
    const kit = session.battle.sides[1].supports.map((s) => s.id)
    let steps = 0
    while (session.battle.phase !== 'finished' && steps++ < 100) {
      const battle = session.battle
      const scoped = { battleId: battle.battleId, expectedVersion: battle.version }
      if (battle.phase === 'replacement')
        session = practiceReducer(session, {
          ...scoped,
          kind: 'replace',
          targetId: battle.sides[0].fighters.find((f) => f.hp > 0)!.id,
        })!
      else {
        const mirrored = structuredClone(battle)
        mirrored.sides = [mirrored.sides[1], mirrored.sides[0]]
        const action = chooseBotAction(mirrored)
        validateAction(battle, 0, action)
        validateAction(battle, 1, session.botAction!)
        session = practiceReducer(session, { ...scoped, kind: 'turn', action, tieBreak: 0 })!
      }
      for (const side of session.battle.sides)
        for (const fighter of side.fighters)
          assert.ok(fighter.hp >= 0 && fighter.hp <= fighter.maxHp)
    }
    assert.equal(session.battle.phase, 'finished')
    const spent = session.rounds
      .flatMap((r) => r.events)
      .filter((e) => e.kind === 'support' && e.side === 1)
      .map((e) => (e.kind === 'support' ? e.supportId : ''))
    totalSupports += spent.length
    assert.equal(new Set(spent).size, spent.length)
    assert.ok(spent.every((id) => kit.includes(id)))
    const rematch = practiceReducer(session, {
      kind: 'start',
      battleId: 'again',
      playerIds: session.battle.sides[0].fighters.map((f) => f.id),
      opponentId: session.opponentId,
      supportIds: session.battle.sides[0].supports.map((s) => s.id),
      opponentSupportIds: kit,
    })!
    assert.deepEqual(
      rematch.battle.sides[1].supports.map((s) => s.id),
      kit,
    )
    assert.ok(rematch.battle.sides[1].supports.every((s) => !s.used))
    assert.equal(rematch.battle.turn, 1)
  }
  assert.ok(totalSupports > 0)
})
