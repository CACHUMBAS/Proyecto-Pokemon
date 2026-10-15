import test from 'node:test'
import assert from 'node:assert/strict'
import { activeFighter } from './battle-state.ts'
import { createPractice, practiceReducer, DEFAULT_PLAYER, DEFAULT_BOT } from './practice.ts'
import { listPracticeOpponents, getPracticeOpponent, DEFAULT_OPPONENT } from './opponents.ts'
import { getPlayableCard } from './playable-roster.ts'

const ids = (s: ReturnType<typeof createPractice>, side: 0 | 1) =>
  s.battle.sides[side].fighters.map((f) => f.id)

test('opponents supply legal distinct teams with increasing rarity budgets and no altered stats', () => {
  const opponents = listPracticeOpponents()
  assert.equal(new Set(opponents.map((o) => o.id)).size, 3)
  let previous = 0
  for (const o of opponents) {
    const s = createPractice(o.id, DEFAULT_PLAYER, false, o.id)
    assert.equal(s.opponentId, o.id)
    assert.deepEqual(ids(s, 1), o.cardIds)
    assert.equal(new Set(s.battle.sides[1].fighters.map((f) => f.speciesId)).size, 6)
    let budget = 0
    for (const f of s.battle.sides[1].fighters) {
      const card = getPlayableCard(f.id)!
      for (const stat of ['maxHp', 'attack', 'defense', 'speed'] as const)
        assert.equal(f[stat], card[stat])
      budget += card.budget
    }
    assert.ok(budget > previous)
    previous = budget
  }
  assert.deepEqual(ids(createPractice('default'), 1), DEFAULT_BOT)
  assert.equal(createPractice('default').opponentId, DEFAULT_OPPONENT)
  assert.throws(() => createPractice('invalid', DEFAULT_PLAYER, false, 'unknown'))
  assert.throws(() => getPracticeOpponent('toString'))
  opponents[0].cardIds.reverse()
  assert.notDeepEqual(opponents[0].cardIds, getPracticeOpponent(opponents[0].id).cardIds)
})

test('every opponent survives turns, forced replacements, a result and a fresh rematch', () => {
  for (const o of listPracticeOpponents()) {
    let s = practiceReducer(null, {
      kind: 'start',
      battleId: o.id,
      playerIds: DEFAULT_PLAYER,
      opponentId: o.id,
    })!
    const originalTeam = ids(s, 1)
    let steps = 0
    while (s.battle.phase !== 'finished' && steps++ < 130) {
      const scoped = { battleId: s.battle.battleId, expectedVersion: s.battle.version }
      if (s.battle.phase === 'replacement') {
        s = practiceReducer(s, {
          ...scoped,
          kind: 'replace',
          targetId: s.battle.sides[0].fighters.find((f) => f.hp > 0)!.id,
        })!
      } else
        s = practiceReducer(s, { ...scoped, kind: 'turn', action: { kind: 'pass' }, tieBreak: 0 })!
      assert.equal(s.opponentId, o.id)
      assert.deepEqual(ids(s, 1), originalTeam)
    }
    assert.equal(s.battle.phase, 'finished')
    const rematch = practiceReducer(s, {
      kind: 'start',
      battleId: o.id + '-rematch',
      playerIds: ids(s, 0),
      opponentId: s.opponentId,
    })!
    assert.equal(rematch.opponentId, o.id)
    assert.deepEqual(ids(rematch, 1), originalTeam)
    assert.equal(rematch.battle.version, 1)
    assert.equal(activeFighter(rematch.battle, 1).hp, activeFighter(rematch.battle, 1).maxHp)
    assert.deepEqual(rematch.rounds, [])
    assert.equal(
      practiceReducer(rematch, { kind: 'exit', battleId: o.id, expectedVersion: 1 }),
      rematch,
    )
  }
})

test('tutorial overrides opponent selection and an incomplete team without losing its fixed rival on dismiss', () => {
  const s = practiceReducer(null, {
    kind: 'start',
    battleId: 'guide',
    playerIds: [],
    opponentId: 'elite',
    tutorial: true,
  })!
  assert.equal(s.opponentId, DEFAULT_OPPONENT)
  assert.deepEqual(ids(s, 1), DEFAULT_BOT)
  assert.equal(s.tutorial, 'welcome')
  const free = practiceReducer(s, {
    kind: 'guide',
    battleId: 'guide',
    expectedVersion: 1,
    expectedStep: 'welcome',
    action: 'dismiss',
  })!
  assert.equal(free.opponentId, DEFAULT_OPPONENT)
  assert.deepEqual(ids(free, 1), DEFAULT_BOT)
  assert.equal(free.tutorial, null)
})
