import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeBattle } from './summary.ts'
import { battle, lastAlive, move, PASS, support } from './fixtures/battle-test-data.ts'
import { resolveTurn } from './turn-engine.ts'
import { createPractice, practiceReducer, chooseBotAction } from './practice.ts'
import type { PracticeSession } from './practice.ts'

const empty = { attackDamage: 0, statusDamageTaken: 0, healed: 0, supportsUsed: 0, fainted: 0 }

test('withholds summaries during selection and replacement', () => {
  const session = createPractice('new')
  assert.equal(summarizeBattle(session), null)
  session.battle.phase = 'replacement'
  assert.equal(summarizeBattle(session), null)
})

test('attributes attack damage to the attacker, residual damage and faints to the affected team', () => {
  const session = createPractice('event-fixture')
  session.battle.phase = 'finished'
  session.battle.result = { kind: 'draw', reason: 'double-knockout' }
  // Synthetic event sequence: replacement events must not add a turn.
  session.rounds = [
    {
      turn: 1,
      events: [
        { kind: 'order', sides: [0, 1], tieBreak: 0 },
        { kind: 'damage', side: 1, targetId: 'enemy', source: 'move', amount: 7, remainingHp: 12 },
        { kind: 'damage', side: 0, targetId: 'ally', source: 'move', amount: 11, remainingHp: 9 },
        { kind: 'damage', side: 0, targetId: 'ally', source: 'poison', amount: 4, remainingHp: 5 },
        { kind: 'damage', side: 1, targetId: 'enemy', source: 'burn', amount: 3, remainingHp: 9 },
        { kind: 'support', side: 0, actorId: 'ally', supportId: 'heal', effect: 'heal', healed: 2 },
        {
          kind: 'support',
          side: 1,
          actorId: 'enemy',
          supportId: 'cleanse',
          effect: 'cleanse',
          healed: 0,
        },
      ],
    },
    { turn: 1, events: [{ kind: 'switch', side: 0, from: 'old', to: 'ally', forced: true }] },
    {
      turn: 2,
      events: [
        { kind: 'order', sides: [0], tieBreak: null },
        { kind: 'damage', side: 1, targetId: 'enemy', source: 'move', amount: 0, remainingHp: 9 },
        { kind: 'blocked', side: 0, actorId: 'ally', reason: 'sleep' },
        { kind: 'status', side: 1, targetId: 'enemy', status: 'poison', outcome: 'immune' },
        { kind: 'faint', side: 0, targetId: 'ally' },
        { kind: 'faint', side: 1, targetId: 'enemy' },
        { kind: 'result', result: { kind: 'draw', reason: 'double-knockout' } },
      ],
    },
  ]
  const before = structuredClone(session)
  function freeze(value: object) {
    for (const entry of Object.values(value)) if (entry && typeof entry === 'object') freeze(entry)
    Object.freeze(value)
  }
  freeze(session)
  const expected = {
    turns: 2,
    sides: [
      { attackDamage: 7, statusDamageTaken: 4, healed: 2, supportsUsed: 1, fainted: 1 },
      { attackDamage: 11, statusDamageTaken: 3, healed: 0, supportsUsed: 1, fainted: 1 },
    ],
  }
  assert.deepEqual(summarizeBattle(session), expected)
  const changed = summarizeBattle(session)!
  changed.sides[0].attackDamage = 999
  assert.deepEqual(summarizeBattle(session), expected)
  assert.deepEqual(session, before)
})

test('counts actual capped HP loss and healing from engine events', () => {
  const state = battle()
  lastAlive(state)
  state.sides[1].fighters[0].hp = 1
  const ko = resolveTurn(state, [move(state, 0), PASS], state.version, 0)
  assert.deepEqual(ko.state.result, { kind: 'win', winner: 0, reason: 'knockout' })
  assert.deepEqual(
    summarizeBattle({ battle: ko.state, rounds: [{ turn: 1, events: ko.events }] }),
    {
      turns: 1,
      sides: [
        { ...empty, attackDamage: 1 },
        { ...empty, fainted: 1 },
      ],
    },
  )
  const injured = battle()
  injured.turn = 60
  injured.sides[0].fighters[0].hp -= 2
  injured.sides[0].fighters[0].status = 'poison'
  injured.sides[1].fighters[0].status = 'burn'
  const healed = resolveTurn(injured, [support(injured, 0, 'heal'), PASS], injured.version)
  assert.deepEqual(
    summarizeBattle({ battle: healed.state, rounds: [{ turn: 60, events: healed.events }] }),
    {
      turns: 1,
      sides: [
        { ...empty, statusDamageTaken: 16, healed: 2, supportsUsed: 1 },
        { ...empty, statusDamageTaken: 10 },
      ],
    },
  )
})

test('reports 60 resolved turns and zero metrics for a passive draw', () => {
  let state = battle()
  const rounds: PracticeSession['rounds'] = []
  while (state.phase !== 'finished') {
    const turn = state.turn
    const next = resolveTurn(state, [PASS, PASS], state.version)
    rounds.push({ turn, events: next.events })
    state = next.state
  }
  assert.deepEqual(summarizeBattle({ battle: state, rounds }), { turns: 60, sides: [empty, empty] })
})

test('full practice matches reconcile HP, replacements and uses; rematches discard the old summary', () => {
  for (const opponentId of ['rookie', 'balanced', 'elite'] as const) {
    let session = createPractice('full-' + opponentId, undefined, false, opponentId, ['base1-90'])
    let steps = 0
    while (session.battle.phase !== 'finished' && steps++ < 100) {
      const state = session.battle
      const scoped = { battleId: state.battleId, expectedVersion: state.version }
      if (state.phase === 'replacement') {
        session = practiceReducer(session, {
          ...scoped,
          kind: 'replace',
          targetId: state.sides[0].fighters.find((f) => f.hp > 0)!.id,
        })!
      } else {
        const mirrored = structuredClone(state)
        mirrored.sides = [mirrored.sides[1], mirrored.sides[0]]
        session = practiceReducer(session, {
          ...scoped,
          kind: 'turn',
          action: chooseBotAction(mirrored),
          tieBreak: 0,
        })!
      }
    }
    const summary = summarizeBattle(session)!
    assert.ok(summary)
    assert.equal(summary.turns, session.battle.turn)
    for (const side of [0, 1] as const) {
      const fighters = session.battle.sides[side].fighters
      const stats = summary.sides[side]
      assert.equal(stats.fainted, fighters.filter((f) => f.hp === 0).length)
      assert.equal(
        stats.supportsUsed,
        session.battle.sides[side].supports.filter((s) => s.used).length,
      )
      assert.equal(
        summary.sides[1 - side].attackDamage + stats.statusDamageTaken - stats.healed,
        fighters.reduce((sum, f) => sum + f.maxHp - f.hp, 0),
      )
    }
    const rematch = practiceReducer(session, {
      kind: 'start',
      battleId: 'rematch',
      playerIds: session.battle.sides[0].fighters.map((f) => f.id),
      opponentId,
      supportIds: ['base1-90'],
      opponentSupportIds: session.battle.sides[1].supports.map((s) => s.id),
    })!
    assert.equal(summarizeBattle(rematch), null)
    assert.deepEqual(rematch.rounds, [])
  }
})
