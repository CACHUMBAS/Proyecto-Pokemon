import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createBattle, validateAction } from './battle-state.ts'
import { resolveTurn, resolveReplacements } from './turn-engine.ts'
import {
  battle,
  setup,
  move,
  support,
  statusMove,
  lastAlive,
  PASS,
} from './fixtures/battle-test-data.ts'
import type { BattleSetup, BattleState, BattleAction, Side, Status } from './engine-types.ts'

function step(s: BattleState, a: BattleAction = PASS, b: BattleAction = PASS, bit?: Side) {
  return resolveTurn(s, [a, b], s.version, bit)
}
function active(s: BattleState, side: Side) {
  return s.sides[side].fighters[s.sides[side].active]
}
function freeze(value: unknown): void {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
}
function changedSetup(change: (s: BattleSetup) => void) {
  const s = setup()
  change(s)
  return s
}

test('starts six full-health distinct fighters, detached from definitions', () => {
  const input = setup()
  freeze(input)
  const s = createBattle(input)
  assert.equal(s.phase, 'selection')
  assert.equal(s.turn, 1)
  assert.equal(s.version, 1)
  assert.equal(s.rulesetVersion, 'lumemon-turns-v1')
  assert.equal(s.damageRulesetVersion, 'lumemon-damage-v1')
  assert.equal(s.dataVersion, 'test-only-v1')
  for (const team of s.sides) {
    assert.equal(team.fighters.length, 6)
    assert.equal(team.active, 0)
    for (const f of team.fighters) {
      assert.equal(f.hp, 204)
      assert.equal(f.status, null)
      assert.equal(f.boost, null)
      assert.equal(f.readyOn.basic, 1)
    }
  }
  assert.notEqual(s.sides[0].fighters[0].moves, input.teams[0].fighters[0].moves)
})

test('rejects invalid teams, profiles, moves, supports and unsafe numbers at creation', () => {
  const changes: ((s: BattleSetup) => void)[] = [
    (s) => Object.assign(s, { battleId: '' }),
    (s) => Object.assign(s, { dataVersion: '' }),
    (s) => Object.assign(s, { teams: [s.teams[0]] }),
    (s) => Object.assign(s.teams[0], { fighters: s.teams[0].fighters.slice(1) }),
    (s) => Object.assign(s.teams[0].fighters[1], { speciesId: 1 }),
    (s) => Object.assign(s.teams[0].fighters[1], { id: 's0-0' }),
    (s) => Object.assign(s.teams[0].fighters[0], { maxHp: Number.MAX_SAFE_INTEGER + 1 }),
    (s) => Object.assign(s.teams[0].fighters[0], { defense: 0 }),
    (s) => Object.assign(s.teams[0].fighters[0], { speed: NaN }),
    (s) => Object.assign(s.teams[0].fighters[0], { types: ['Fire'] }),
    (s) => Object.assign(s.teams[0].fighters[0], { moves: [] }),
    (s) => Object.assign(s.teams[0].fighters[0].moves[0], { id: '__proto__' }),
    (s) => Object.assign(s.teams[0].fighters[0].moves[0], { power: 60, cooldown: 0 }),
    (s) => Object.assign(s.teams[0].fighters[0].moves[2], { status: 'confusion' }),
    (s) => Object.assign(s.teams[0].supports[1], { effect: 'heal' }),
    (s) => Object.assign(s.teams[0].supports[1], { id: 'heal' }),
    (s) => Object.assign(s.teams[0], { supports: new Array(2) }),
    (s) => Object.assign(s.teams[0], { fighters: new Array(6) }),
  ]
  for (const change of changes) assert.throws(() => createBattle(changedSetup(change)), /Invalid/)
  assert.throws(() => createBattle(null as unknown as BattleSetup), /Invalid/)
})

test('switches before attacks and targets the incoming ground type (zero electric damage)', () => {
  const s = battle()
  Object.assign(active(s, 0), {
    moves: [{ id: 'basic', kind: 'damage', type: 'electric', power: 40, cooldown: 0 }],
  })
  Object.assign(active(s, 1), { types: ['water'] })
  Object.assign(s.sides[1].fighters[1], { types: ['ground'] })
  const result = step(s, move(s, 0), { kind: 'switch', actorId: 's1-0', targetId: 's1-1' })
  assert.equal(result.state.sides[1].active, 1)
  assert.equal(active(result.state, 1).hp, 204)
  assert.equal(result.events[0].kind, 'switch')
  assert.equal(result.events.find((e) => e.kind === 'damage')?.amount, 0)
})

test('switch clears temporary effects and sleep/freeze, retains persistent status and cooldowns', () => {
  for (const status of ['sleep', 'freeze', 'poison', 'burn', 'paralysis'] as const) {
    const s = battle()
    const f = active(s, 0)
    f.status = status
    f.boost = { charges: 2, expiresAfter: 3 }
    f.barrierUntil = 2
    f.readyOn.strong = 3
    const out = step(s, { kind: 'switch', actorId: f.id, targetId: 's0-1' }).state.sides[0]
      .fighters[0]
    assert.equal(out.status, status === 'sleep' || status === 'freeze' ? null : status)
    assert.equal(out.boost, null)
    assert.equal(out.barrierUntil, null)
    assert.equal(out.readyOn.strong, 3)
    assert.equal(out.hp, 204)
  }
})

test('uses fixed effective-speed order, records explicit ties, never changes order mid-turn', () => {
  const s = battle()
  assert.throws(() => step(s, move(s, 0), move(s, 1)), /tie/i)
  for (const bit of [0, 1] as const) {
    const r = step(s, move(s, 0), move(s, 1), bit)
    assert.deepEqual(
      r.events.find((e) => e.kind === 'order'),
      { kind: 'order', sides: [bit, 1 - bit], tieBreak: bit },
    )
    assert.equal(active(r.state, 0).hp, 144)
    assert.equal(active(r.state, 1).hp, 144)
  }
  Object.assign(active(s, 0), { speed: 120 })
  Object.assign(active(s, 1), { speed: 80 })
  statusMove(s, 0, 'paralysis')
  const r = step(s, move(s, 0, 'status'), move(s, 1))
  assert.equal(active(r.state, 1).status, 'paralysis')
  assert.equal(active(r.state, 0).hp, 144)
  assert.deepEqual(r.events.find((e) => e.kind === 'order')?.sides, [0, 1])
  active(s, 0).status = 'paralysis'
  assert.deepEqual(
    step(s, move(s, 0), move(s, 1)).events.find((e) => e.kind === 'order')?.sides,
    [1, 0],
  )
})

test('rejects wrong actor, cooldowns, invalid switches, actions, phase and stale version atomically', () => {
  const s = battle()
  active(s, 0).readyOn.strong = 3
  const bad = [
    { kind: 'move', actorId: 's0-1', moveId: 'basic' },
    { kind: 'move', actorId: 's0-0', moveId: 'unknown' },
    move(s, 0, 'strong'),
    { kind: 'switch', actorId: 's0-0', targetId: 's0-0' },
    { kind: 'switch', actorId: 's0-0', targetId: 's1-1' },
    { kind: 'support', actorId: 's0-0', supportId: 'heal' },
    { kind: 'support', actorId: 's0-0', supportId: 'cleanse' },
    { kind: 'invalid' },
    null,
  ]
  const before = structuredClone(s)
  for (const a of bad) assert.throws(() => step(s, a as BattleAction), /Invalid/)
  assert.throws(() => resolveTurn(s, [PASS, PASS], 0), /version/i)
  assert.throws(() => validateAction(s, 2 as Side, PASS), /Invalid/)
  assert.throws(
    () => resolveTurn(s, [PASS] as unknown as [BattleAction, BattleAction], 1),
    /Invalid/,
  )
  assert.deepEqual(s, before)
})

test('cooldowns count full turns, include immunity, and progress in reserves', () => {
  let s = battle()
  Object.assign(active(s, 1), { types: ['ghost'] })
  s = step(s, move(s, 0, 'strong')).state
  assert.equal(active(s, 0).readyOn.strong, 3)
  assert.throws(() => validateAction(s, 0, move(s, 0, 'strong')), /Invalid/)
  s = step(s, { kind: 'switch', actorId: 's0-0', targetId: 's0-1' }).state
  assert.equal(s.turn, 3)
  s = step(s, { kind: 'switch', actorId: 's0-1', targetId: 's0-0' }).state
  assert.doesNotThrow(() => validateAction(s, 0, move(s, 0, 'strong')))
  const t = battle()
  const out = step(t, move(t, 0, 'status')).state
  assert.equal(active(out, 0).readyOn.status, 4)
})

test('sleep and freeze block one movement attempt without spending cooldown or boost', () => {
  for (const status of ['sleep', 'freeze'] as const) {
    const s = battle()
    active(s, 0).status = status
    active(s, 0).boost = { charges: 2, expiresAfter: 3 }
    const passed = step(s).state
    assert.equal(active(passed, 0).status, status)
    const r = step(passed, move(passed, 0, 'strong'))
    assert.equal(active(r.state, 0).status, null)
    assert.equal(active(r.state, 0).readyOn.strong, 1)
    assert.equal(active(r.state, 0).boost?.charges, 2)
    assert.equal(active(r.state, 1).hp, 204)
    assert.equal(r.events.find((e) => e.kind === 'blocked')?.reason, status)
  }
})

test('new sleep blocks the pending attack that same turn', () => {
  const s = battle()
  Object.assign(active(s, 0), { speed: 150 })
  statusMove(s, 0, 'sleep')
  const r = step(s, move(s, 0, 'status'), move(s, 1, 'strong'))
  assert.equal(active(r.state, 0).hp, 204)
  assert.equal(active(r.state, 1).status, null)
  assert.equal(active(r.state, 1).readyOn.strong, 1)
})

test('positive fire damage thaws before pending action', () => {
  const s = battle()
  Object.assign(active(s, 0), {
    speed: 150,
    moves: [{ id: 'basic', kind: 'damage', type: 'fire', power: 40, cooldown: 0 }],
  })
  active(s, 1).status = 'freeze'
  const r = step(s, move(s, 0), move(s, 1))
  assert.equal(active(r.state, 1).status, null)
  assert.equal(active(r.state, 0).hp, 144)
  assert.equal(active(r.state, 1).hp, 156)
})

test('status moves respect status/type immunities and never replace an existing status', () => {
  const cases: [Status, string][] = [
    ['poison', 'poison'],
    ['poison', 'steel'],
    ['burn', 'fire'],
    ['paralysis', 'electric'],
    ['freeze', 'ice'],
  ]
  for (const [status, type] of cases) {
    const s = battle()
    statusMove(s, 0, status)
    Object.assign(active(s, 1), { types: [type] })
    const r = step(s, move(s, 0, 'status'))
    assert.equal(active(r.state, 1).status, null)
    assert.equal(r.events.find((e) => e.kind === 'status')?.outcome, 'immune')
  }
  const s = battle()
  Object.assign(active(s, 1), { types: ['ghost'] })
  assert.equal(active(step(s, move(s, 0, 'status')).state, 1).status, null)
  Object.assign(active(s, 1), { types: ['normal'] })
  active(s, 1).status = 'paralysis'
  const r = step(s, move(s, 0, 'status'))
  assert.equal(active(r.state, 1).status, 'paralysis')
  assert.equal(active(r.state, 0).readyOn.status, 4)
  assert.equal(r.events.find((e) => e.kind === 'status')?.outcome, 'occupied')
})

test('new poison ticks immediately, burn reduces outgoing damage and ticks 5 percent', () => {
  const s = battle()
  active(s, 1).status = 'burn'
  const r = step(s, move(s, 0, 'status'), move(s, 1), 0)
  assert.equal(active(r.state, 0).hp, 156)
  assert.equal(active(r.state, 1).hp, 194)
  const t = battle()
  assert.equal(active(step(t, move(t, 0, 'status')).state, 1).hp, 188)
})

test('heal and cleanse act before moves; consume one support, do not revive', () => {
  const s = battle()
  active(s, 0).hp = 180
  const r = step(s, support(s, 0, 'heal'), move(s, 1))
  assert.equal(active(r.state, 0).hp, 144)
  assert.equal(r.events.find((e) => e.kind === 'support')?.healed, 24)
  assert.equal(r.state.sides[0].supports[0].used, true)
  assert.throws(() => validateAction(r.state, 0, support(r.state, 0, 'heal')), /Invalid/)
  const t = battle()
  active(t, 0).status = 'poison'
  const out = step(t, support(t, 0, 'cleanse')).state
  assert.equal(active(out, 0).status, null)
  assert.equal(active(out, 0).hp, 204)
})

test('barrier protects activation and next turn only; does not reduce residual damage', () => {
  let s = battle()
  s.sides[0].supports = [{ id: 'barrier', effect: 'barrier', used: false }]
  active(s, 0).status = 'burn'
  s = step(s, support(s, 0, 'barrier'), move(s, 1)).state
  assert.equal(active(s, 0).hp, 152)
  assert.equal(active(s, 0).barrierUntil, 2)
  const r = step(s, PASS, move(s, 1))
  s = r.state
  assert.equal(active(s, 0).hp, 100)
  assert.equal(active(s, 0).barrierUntil, null)
  assert.equal(r.events.find((e) => e.kind === 'expired')?.effect, 'barrier')
  assert.equal(active(step(s, PASS, move(s, 1)).state, 0).hp, 30)
})

test('boost consumes two damage executions including immunity; status attempts preserve charges', () => {
  let s = battle()
  s = step(s, support(s, 0, 'boost')).state
  assert.equal(active(s, 0).boost?.expiresAfter, 3)
  s = step(s, move(s, 0)).state
  assert.equal(active(s, 1).hp, 114)
  assert.equal(active(s, 0).boost?.charges, 1)
  s = step(s, move(s, 0)).state
  assert.equal(active(s, 1).hp, 24)
  assert.equal(active(s, 0).boost, null)
  const t = battle()
  Object.assign(active(t, 1), { types: ['ghost'] })
  active(t, 0).boost = { charges: 2, expiresAfter: 3 }
  const immune = step(t, move(t, 0)).state
  assert.equal(active(immune, 0).boost?.charges, 1)
  assert.equal(active(step(t, move(t, 0, 'status')).state, 0).boost?.charges, 2)
  assert.equal(active(step(step(step(t).state).state).state, 0).boost, null)
})

test('faint cancels pending action and clears status/buffs; replacement is a separate phase', () => {
  const s = battle()
  Object.assign(active(s, 0), { speed: 150 })
  active(s, 1).hp = 20
  active(s, 1).status = 'poison'
  active(s, 1).boost = { charges: 2, expiresAfter: 3 }
  const r = step(s, move(s, 0), move(s, 1, 'strong'))
  assert.equal(r.state.phase, 'replacement')
  assert.equal(r.state.turn, 1)
  assert.equal(active(r.state, 0).hp, 204)
  assert.equal(active(r.state, 1).hp, 0)
  assert.equal(active(r.state, 1).status, null)
  assert.equal(active(r.state, 1).boost, null)
  assert.equal(active(r.state, 1).readyOn.strong, 1)
  assert.equal(r.events.find((e) => e.kind === 'blocked')?.reason, 'knockout')
  assert.throws(() => step(r.state), /phase/i)
  const next = resolveReplacements(r.state, [null, 's1-3'], r.state.version)
  assert.equal(next.state.sides[1].active, 3)
  assert.equal(next.state.turn, 2)
  assert.equal(next.state.version, 3)
  assert.equal(next.state.phase, 'selection')
})

test('both forced replacements resolve together, default to first living and do not tick poison again', () => {
  const s = battle()
  for (const side of [0, 1] as const) {
    active(s, side).hp = 16
    active(s, side).status = 'poison'
  }
  const closed = step(s).state
  assert.equal(closed.phase, 'replacement')
  const before = structuredClone(closed)
  assert.throws(() => resolveReplacements(closed, ['s0-0', null], closed.version), /Invalid/)
  assert.throws(() => resolveReplacements(closed, [null, null], 1), /version/i)
  assert.deepEqual(closed, before)
  const next = resolveReplacements(closed, [null, null], closed.version).state
  assert.equal(next.sides[0].active, 1)
  assert.equal(next.sides[1].active, 1)
  assert.equal(active(next, 0).hp, 204)
  assert.equal(next.turn, 2)
})

test('direct final KO ends immediately, before lethal poison to winner', () => {
  const s = battle()
  lastAlive(s)
  Object.assign(active(s, 0), { speed: 150 })
  active(s, 0).hp = 1
  active(s, 0).status = 'poison'
  active(s, 1).hp = 1
  const r = step(s, move(s, 0), move(s, 1))
  assert.deepEqual(r.state.result, { kind: 'win', winner: 0, reason: 'knockout' })
  assert.equal(r.state.phase, 'finished')
  assert.equal(active(r.state, 0).hp, 1)
  assert.equal(r.events.filter((e) => e.kind === 'result').length, 1)
  assert.throws(() => step(r.state), /phase/i)
})

test('simultaneous residual final KO draws, single residual KO wins', () => {
  const s = battle()
  lastAlive(s)
  for (const side of [0, 1] as const) {
    active(s, side).hp = 16
    active(s, side).status = 'poison'
  }
  assert.deepEqual(step(s).state.result, { kind: 'draw', reason: 'double-knockout' })
  active(s, 0).hp = 17
  const r = step(s).state
  assert.deepEqual(r.result, { kind: 'win', winner: 0, reason: 'knockout' })
  assert.equal(active(r, 0).hp, 1)
})

test('turn 60 draws before replacements but after checking knockout winner', () => {
  const s = battle()
  s.turn = 60
  active(s, 0).hp = 16
  active(s, 0).status = 'poison'
  const r = step(s).state
  assert.deepEqual(r.result, { kind: 'draw', reason: 'turn-limit' })
  assert.equal(r.turn, 60)
  assert.equal(r.phase, 'finished')
  lastAlive(s)
  assert.deepEqual(step(s).state.result, { kind: 'win', winner: 1, reason: 'knockout' })
})

test('frozen inputs replay identically through JSON without mutation or shared state', () => {
  const s = battle()
  const a = [move(s, 0), move(s, 1)] as const
  const before = structuredClone(s)
  freeze(s)
  freeze(a)
  const first = resolveTurn(s, a, 1, 1)
  const second = resolveTurn(JSON.parse(JSON.stringify(s)), a, 1, 1)
  assert.deepEqual(first, second)
  assert.deepEqual(s, before)
  assert.deepEqual(JSON.parse(JSON.stringify(first)), first)
  first.state.sides[0].fighters[0].hp = 1
  assert.equal(active(second.state, 0).hp, 144)
})

test('whole passive match terminates at turn 60 without time, RNG, or external data', () => {
  let s = battle()
  while (s.phase !== 'finished') s = step(s).state
  assert.equal(s.turn, 60)
  assert.equal(s.version, 61)
  assert.deepEqual(s.result, { kind: 'draw', reason: 'turn-limit' })
})
