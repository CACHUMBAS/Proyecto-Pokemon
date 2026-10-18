import test from 'node:test'
import assert from 'node:assert/strict'
import { chooseTacticalBotAction } from './bot.ts'
import {
  chooseBotAction,
  createPractice,
  practiceReducer,
  DEFAULT_PLAYER,
  DEFAULT_BOT,
} from './practice.ts'
import { activeFighter, validateAction } from './battle-state.ts'
import { createPlayableBattle } from './playable-roster.ts'
import { resolveTurn } from './turn-engine.ts'
import { getPracticeOpponent } from './opponents.ts'
import { presentationReducer, createPresentation } from './playback.ts'
import type { BattleState, BattleAction } from './engine-types.ts'

const electricTeam = ['base1-58', ...DEFAULT_PLAYER.filter((id) => id !== 'base1-58')]
function threatened() {
  return createPlayableBattle('tactical', [electricTeam, getPracticeOpponent('elite').cardIds])
}
function move(state: BattleState, id: string): BattleAction {
  return { kind: 'move', actorId: activeFighter(state, 0).id, moveId: id }
}
function freezeDeep(value: object) {
  for (const item of Object.values(value)) if (item && typeof item === 'object') freezeDeep(item)
  Object.freeze(value)
}

test('tactical bot protects Charizard from electric attacks with a living safer reserve', () => {
  const state = threatened()
  // Leave Venusaur as the only healthy reserve to make the choice unambiguous.
  state.sides[1].fighters.slice(2).forEach((f) => {
    f.hp = 0
  })
  const action = chooseTacticalBotAction(state)
  assert.deepEqual(action, { kind: 'switch', actorId: 'sv03.5-199', targetId: 'sv03.5-198' })
  validateAction(state, 1, action)
  const result = resolveTurn(state, [move(state, 'pokeapi-85'), action], state.version, 0)
  assert.equal(activeFighter(result.state, 1).id, 'sv03.5-198')
  assert.ok(activeFighter(result.state, 1).hp > activeFighter(result.state, 1).maxHp / 2)
  assert.ok(result.events.some((e) => e.kind === 'switch' && e.side === 1 && !e.forced))
  assert.ok(!result.events.some((e) => e.kind === 'move' && e.side === 1))
})

test('tactical bot stays for a useful safe attack and respects the player cooldown', () => {
  const favorable = createPractice('favorable', DEFAULT_PLAYER, false, 'elite').battle
  assert.deepEqual(chooseTacticalBotAction(favorable), chooseBotAction(favorable))
  const state = threatened()
  activeFighter(state, 0).readyOn['pokeapi-85'] = 2
  assert.notEqual(chooseTacticalBotAction(state).kind, 'switch')
})

test('tactical bot can leave an immune matchup instead of wasting every attack', () => {
  const ghosts = ['base1-50', ...DEFAULT_PLAYER.slice(0, 5)]
  const normalLead = ['base2-51', ...DEFAULT_BOT.filter((id) => id !== 'base2-51')]
  const state = createPlayableBattle('immune', [ghosts, normalLead])
  assert.equal(chooseBotAction(state).kind, 'move')
  const action = chooseTacticalBotAction(state)
  assert.equal(action.kind, 'switch')
  validateAction(state, 1, action)
  const next = resolveTurn(state, [{ kind: 'pass' }, action], state.version, 0).state
  const response = resolveTurn(next, [{ kind: 'pass' }, chooseBotAction(next)], next.version, 0)
  assert.ok(response.events.some((e) => e.kind === 'damage' && e.side === 0 && e.amount > 0))
})

test('tactical bot rejects doomed or sleeping reserves and does not abandon a safe knockout', () => {
  const doomed = threatened()
  doomed.sides[1].fighters.slice(1).forEach((f) => {
    f.hp = 1
    f.status = 'poison'
  })
  assert.notEqual(chooseTacticalBotAction(doomed).kind, 'switch')
  const sleeping = threatened()
  sleeping.sides[1].fighters.slice(1).forEach((f) => {
    f.status = 'sleep'
  })
  assert.notEqual(chooseTacticalBotAction(sleeping).kind, 'switch')
  const finish = threatened()
  activeFighter(finish, 0).hp = 1
  activeFighter(finish, 0).status = 'paralysis'
  activeFighter(finish, 1).hp = 20
  const action = chooseTacticalBotAction(finish)
  assert.equal(action.kind, 'move')
  const result = resolveTurn(finish, [move(finish, 'pokeapi-85'), action], finish.version, 0)
  assert.equal(activeFighter(result.state, 0).hp, 0)
  assert.ok(activeFighter(result.state, 1).hp > 0)
})

test('switch spacing prevents repeated retreats and the last turn is used for an action', () => {
  const state = threatened()
  for (const turn of [2, 3]) {
    state.turn = turn
    assert.notEqual(chooseTacticalBotAction(state, 1).kind, 'switch')
  }
  state.turn = 4
  assert.equal(chooseTacticalBotAction(state, 1).kind, 'switch')
  state.turn = 60
  assert.notEqual(chooseTacticalBotAction(state).kind, 'switch')
})

test('policy is deterministic, pure and produces legal actions for real roster states', () => {
  const state = threatened(),
    before = structuredClone(state)
  freezeDeep(state)
  const action = chooseTacticalBotAction(state)
  assert.deepEqual(chooseTacticalBotAction(state), action)
  assert.deepEqual(state, before)
  validateAction(state, 1, action)
  for (const status of ['burn', 'poison', 'paralysis', 'sleep', 'freeze'] as const) {
    const changed = threatened()
    activeFighter(changed, 1).status = status
    validateAction(changed, 1, chooseTacticalBotAction(changed))
  }
})

test('only Elite switches voluntarily, action is precommitted and replayed before damage', () => {
  const session = createPractice('committed', electricTeam, false, 'elite')
  assert.equal(session.botAction!.kind, 'switch')
  for (const playerAction of [
    { kind: 'pass' } as const,
    move(session.battle, 'pokeapi-85'),
    { kind: 'switch', actorId: 'base1-58', targetId: 'base1-46' } as const,
  ]) {
    const next = practiceReducer(session, {
      kind: 'turn',
      battleId: 'committed',
      expectedVersion: 1,
      action: playerAction,
      tieBreak: 0,
    })!
    const actual = next.rounds
      .flatMap((r) => r.events)
      .find((e) => e.kind === 'switch' && e.side === 1)
    assert.equal(
      actual?.kind === 'switch' ? actual.to : null,
      session.botAction!.kind === 'switch' ? session.botAction!.targetId : null,
    )
    assert.deepEqual(next.botAction, chooseTacticalBotAction(next.battle, 1))
  }
  for (const opponentId of ['rookie', 'balanced'] as const) {
    const normal = createPractice('basic', electricTeam, false, opponentId)
    assert.deepEqual(normal.botAction, chooseBotAction(normal.battle))
  }
  const tutorial = createPractice('lesson', [], true, 'elite')
  assert.equal(tutorial.opponentId, 'balanced')
  const dismissed = practiceReducer(tutorial, {
    kind: 'guide',
    battleId: 'lesson',
    expectedVersion: 1,
    expectedStep: 'welcome',
    action: 'dismiss',
  })!
  assert.deepEqual(dismissed.botAction, chooseBotAction(dismissed.battle))
  let p = presentationReducer(createPresentation(), {
    kind: 'start',
    battleId: 'frames',
    playerIds: electricTeam,
    opponentId: 'elite',
  })
  p = presentationReducer(p, {
    kind: 'turn',
    battleId: 'frames',
    expectedVersion: 1,
    action: move(p.session!.battle, 'pokeapi-85'),
    tieBreak: 0,
  })
  const switchFrame = p.frames.findIndex((f) => f.event?.kind === 'switch' && f.event.side === 1)
  const hitFrame = p.frames.findIndex((f) => f.event?.kind === 'damage' && f.event.side === 1)
  assert.ok(switchFrame >= 0 && hitFrame > switchFrame)
  assert.equal(
    activeFighter(p.frames[switchFrame].battle, 1).hp,
    activeFighter(p.frames[switchFrame].battle, 1).maxHp,
  )
})

test('tactical practice completes reproducibly with attacking and switching players, including bot knockouts', () => {
  for (const team of [electricTeam, [...getPracticeOpponent('elite').cardIds].reverse()]) {
    let session = createPractice('complete', team, false, 'elite')
    let steps = 0
    let lastEntry = -3
    while (session.battle.phase !== 'finished' && steps++ < 130) {
      const state = session.battle
      const scope = { battleId: state.battleId, expectedVersion: state.version }
      if (state.phase === 'replacement') {
        session = practiceReducer(session, {
          ...scope,
          kind: 'replace',
          targetId: state.sides[0].fighters.find((f) => f.hp > 0)!.id,
        })!
      } else {
        const mirror = structuredClone(state)
        mirror.sides = [mirror.sides[1], mirror.sides[0]]
        const reserve = state.sides[0].fighters.find(
          (f) => f.hp > 0 && f.id !== activeFighter(state, 0).id,
        )
        const action: BattleAction =
          state.turn % 4 === 0 && reserve
            ? { kind: 'switch', actorId: activeFighter(state, 0).id, targetId: reserve.id }
            : chooseBotAction(mirror)
        validateAction(state, 1, session.botAction!)
        const command = { ...scope, kind: 'turn' as const, action, tieBreak: 0 as const }
        const next = practiceReducer(session, command)!
        assert.deepEqual(practiceReducer(session, command), next)
        const entry = next.rounds.at(-1)!.events.find((e) => e.kind === 'switch' && e.side === 1)
        if (entry?.kind === 'switch') {
          if (!entry.forced) assert.ok(state.turn - lastEntry > 2)
          lastEntry = state.turn
        }
        session = next
      }
      assert.equal(session.opponentId, 'elite')
      for (const side of session.battle.sides)
        for (const f of side.fighters) assert.ok(f.hp >= 0 && f.hp <= f.maxHp)
    }
    assert.equal(session.battle.phase, 'finished')
    assert.ok(session.battle.turn <= 60)
    const rematch = createPractice('new-match', team, false, 'elite')
    assert.deepEqual(rematch.botAction, chooseTacticalBotAction(rematch.battle))
    assert.equal(rematch.rounds.length, 0)
  }
})
