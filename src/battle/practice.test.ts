import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { activeFighter, validateAction } from './battle-state.ts'
import { createPlayableBattle, listPlayableCards } from './playable-roster.ts'
import {
  chooseBotAction,
  createPractice,
  practiceReducer,
  DEFAULT_PLAYER,
  DEFAULT_BOT,
} from './practice.ts'
import type { PracticeSession } from './practice.ts'
import type { BattleAction } from './engine-types.ts'
import { resolveTurn } from './turn-engine.ts'
import type { CardRecord } from '../catalog/types.ts'

function turn(session: PracticeSession, action: BattleAction = { kind: 'pass' }) {
  return {
    kind: 'turn' as const,
    battleId: session.battle.battleId,
    expectedVersion: session.battle.version,
    action,
    tieBreak: 0 as const,
  }
}
function withLowHp(side: 0 | 1) {
  const session = createPractice('ko')
  activeFighter(session.battle, side).hp = 1
  return session
}
test('practice starts with two legal distinct teams and a precommitted bot action', () => {
  const s = createPractice('practice')
  assert.equal(s.battle.sides[0].fighters.length, 6)
  assert.equal(s.battle.sides[1].fighters.length, 6)
  assert.deepEqual(s.botAction, chooseBotAction(s.battle))
  validateAction(s.battle, 1, s.botAction!)
  assert.deepEqual(s.rounds, [])
  assert.throws(() => createPractice('bad', [...DEFAULT_PLAYER.slice(0, 5), DEFAULT_PLAYER[0]]))
})
test('bot scores only legal actions, respects cooldown and leaves its input unchanged', () => {
  const state = createPlayableBattle('bot', [DEFAULT_PLAYER, DEFAULT_BOT])
  const bot = activeFighter(state, 1)
  for (const move of bot.moves) bot.readyOn[move.id] = state.turn + 1
  const before = structuredClone(state)
  assert.deepEqual(chooseBotAction(state), { kind: 'pass' })
  assert.deepEqual(state, before)
  bot.readyOn[bot.moves[0].id] = state.turn
  assert.deepEqual(chooseBotAction(state), {
    kind: 'move',
    actorId: bot.id,
    moveId: bot.moves[0].id,
  })
  bot.status = 'sleep'
  validateAction(state, 1, chooseBotAction(state))
})
test('session resolves the action chosen before player input; input session stays untouched', () => {
  const s = createPractice('locked')
  const before = structuredClone(s)
  const player = activeFighter(s.battle, 0)
  const action: BattleAction = { kind: 'switch', actorId: player.id, targetId: DEFAULT_PLAYER[1] }
  const expected = resolveTurn(s.battle, [action, s.botAction!], s.battle.version, 0)
  const next = practiceReducer(s, turn(s, action))!
  assert.deepEqual(next.battle, expected.state)
  assert.deepEqual(next.rounds[0].events, expected.events)
  assert.deepEqual(next.botAction, chooseBotAction(next.battle))
  assert.deepEqual(s, before)
})
test('duplicate and previous-match commands cannot advance a new version or a rematch', () => {
  const s = createPractice('old')
  const cmd = turn(s)
  const next = practiceReducer(s, cmd)!
  assert.equal(practiceReducer(next, cmd), next)
  const restarted = practiceReducer(next, {
    kind: 'start',
    battleId: 'new',
    playerIds: DEFAULT_PLAYER,
  })!
  assert.equal(practiceReducer(restarted, cmd), restarted)
  assert.equal(restarted.battle.version, 1)
  assert.equal(
    restarted.battle.sides[0].fighters.every((f) => f.hp === f.maxHp),
    true,
  )
  assert.deepEqual(restarted.rounds, [])
})
test('player knockout waits for a living reserve and replacement does not tick damage twice', () => {
  const s = withLowHp(0)
  const next = practiceReducer(s, turn(s))!
  assert.equal(next.battle.phase, 'replacement')
  assert.equal(next.botAction, null)
  const replace = {
    kind: 'replace' as const,
    battleId: next.battle.battleId,
    expectedVersion: next.battle.version,
    targetId: DEFAULT_PLAYER[1],
  }
  assert.throws(() => practiceReducer(next, { ...replace, targetId: DEFAULT_PLAYER[0] }))
  const resumed = practiceReducer(next, replace)!
  assert.equal(resumed.battle.phase, 'selection')
  assert.equal(activeFighter(resumed.battle, 0).id, DEFAULT_PLAYER[1])
  assert.equal(resumed.battle.turn, 2)
  assert.equal(
    resumed.rounds.flatMap((r) => r.events).filter((e) => e.kind === 'damage').length,
    next.rounds.flatMap((r) => r.events).filter((e) => e.kind === 'damage').length,
  )
  assert.equal(practiceReducer(resumed, replace), resumed)
})
test('bot-only knockout advances automatically; simultaneous knockout waits for the player', () => {
  const s = withLowHp(1)
  s.botAction = { kind: 'pass' }
  const player = activeFighter(s.battle, 0)
  const move = player.moves.find((m) => m.kind === 'damage')!
  const next = practiceReducer(s, turn(s, { kind: 'move', actorId: player.id, moveId: move.id }))!
  assert.equal(next.battle.phase, 'selection')
  assert.equal(next.battle.turn, 2)
  assert.equal(activeFighter(next.battle, 1).id, DEFAULT_BOT[1])
  const both = createPractice('both')
  both.botAction = { kind: 'pass' }
  for (const side of [0, 1] as const) {
    activeFighter(both.battle, side).hp = 1
    activeFighter(both.battle, side).status = 'burn'
  }
  const dead = practiceReducer(both, turn(both))!
  assert.equal(dead.battle.phase, 'replacement')
  const ready = practiceReducer(dead, {
    kind: 'replace',
    battleId: 'both',
    expectedVersion: dead.battle.version,
    targetId: DEFAULT_PLAYER[2],
  })!
  assert.equal(ready.battle.phase, 'selection')
  assert.equal(activeFighter(ready.battle, 0).id, DEFAULT_PLAYER[2])
  assert.equal(activeFighter(ready.battle, 1).id, DEFAULT_BOT[1])
})
test('complete practice reaches a result, rejects further turns, and can exit', () => {
  let s = createPractice('full')
  let steps = 0
  while (s.battle.phase !== 'finished' && steps++ < 130) {
    if (s.battle.phase === 'replacement') {
      s = practiceReducer(s, {
        kind: 'replace',
        battleId: 'full',
        expectedVersion: s.battle.version,
        targetId: s.battle.sides[0].fighters.find((f) => f.hp > 0)!.id,
      })!
    } else s = practiceReducer(s, turn(s))!
  }
  assert.equal(s.battle.phase, 'finished')
  assert.ok(s.battle.result)
  assert.equal(s.botAction, null)
  assert.throws(() => practiceReducer(s, turn(s)))
  assert.equal(
    practiceReducer(s, { kind: 'exit', battleId: 'full', expectedVersion: s.battle.version }),
    null,
  )
})
test('practice artwork is an exact subset of the catalog with every playable identity once', () => {
  const art = JSON.parse(
    readFileSync(new URL('../features/practice/card-artwork.json', import.meta.url), 'utf8'),
  ) as CardRecord[]
  assert.deepEqual(
    art.map((c) => c.id).sort(),
    listPlayableCards()
      .map((c) => c.id)
      .sort(),
  )
  for (const c of art) {
    const original = JSON.parse(
      readFileSync(
        new URL(
          '../../public/catalog/snapshots/523febef1a683029/variants/' + c.speciesIds[0] + '.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ) as CardRecord[]
    assert.deepEqual(
      c,
      original.find((o) => o.id === c.id),
    )
  }
})
