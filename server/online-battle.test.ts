import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createBattleService, publicView } from './online-battle.ts'
import { parseRequest } from '../src/online-battle/protocol.ts'
import { parseView } from '../src/online-battle/validation.ts'
import { chooseBotAction } from '../src/battle/bot.ts'
import type { PrivateContext, BattleRepository } from './online-battle.ts'
import type { BattleCommand } from '../src/online-battle/protocol.ts'
const id = 'bb200000-0000-4000-8000-000000000001'
const req = (n: number) => 'cc200000-0000-4000-8000-' + String(n).padStart(12, '0')
const team = ['base1-44', 'base1-46', 'base1-63', 'base1-58', 'base1-52', 'base2-51']
function fixture() {
  const receipts = new Map<string, { command: BattleCommand; match: PrivateContext['match'] }>()
  const state: PrivateContext = {
    user_id: id,
    version: 'lumemon-online-v1',
    coins: 0,
    owned: team.map((card_id) => ({ card_id, quantity: 1 })),
    match: null,
    receipt: null,
  }
  let writes = 0
  const repo: BattleRepository = {
    async read(user, request) {
      assert.equal(user, id)
      const receipt = request ? receipts.get(request) : undefined
      return structuredClone({
        ...state,
        receipt: receipt ? { requestId: request!, command: receipt.command } : null,
        match: receipt ? receipt.match : state.match,
      })
    },
    async write(user, request, command, session) {
      assert.equal(user, id)
      writes++
      if (command.kind === 'start')
        state.match = { id: request, revision: 0, status: 'active', reward: 0, session: session! }
      else {
        assert.ok(state.match)
        state.match.revision++
        if (command.kind === 'abandon') state.match.status = 'abandoned'
        else {
          state.match.session = session!
          state.match.status = session!.battle.phase === 'finished' ? 'finished' : 'active'
        }
        const r = state.match.session.battle.result
        if (state.match.status === 'finished' && r?.kind === 'win' && r.winner === 0) {
          state.coins += 50
          state.match.reward = 50
        }
      }
      receipts.set(request, { command, match: structuredClone(state.match) })
      return repo.read(user, request)
    },
  }
  return {
    repo,
    service: createBattleService(repo, () => 0),
    get: () => state,
    writes: () => writes,
  }
}
test('strict protocol rejects forged results, rewards, extra properties, invalid revisions and IDs', () => {
  for (const x of [
    { kind: 'submit', requestId: req(1), command: { kind: 'win', coins: 50 } },
    { kind: 'submit', requestId: req(1), command: { kind: 'start', cardIds: team, reward: 50 } },
    {
      kind: 'submit',
      requestId: req(1),
      command: { kind: 'turn', battleId: req(2), expectedRevision: '0', action: { kind: 'pass' } },
    },
    { kind: 'submit', requestId: 'bad', command: { kind: 'start', cardIds: team } },
    { kind: 'load', userId: id },
    {
      kind: 'submit',
      requestId: req(1),
      command: {
        kind: 'turn',
        battleId: req(2),
        expectedRevision: 0,
        action: { kind: 'pass', result: 'win' },
      },
    },
  ])
    assert.throws(() => parseRequest(x), /invalid_request/)
  assert.deepEqual(
    parseRequest({ kind: 'submit', requestId: req(1), command: { kind: 'start', cardIds: team } })
      .kind,
    'submit',
  )
})
test('server checks ownership, suppresses future bot choice, rejects illegal actions and stale turns', async () => {
  const f = fixture()
  await assert.rejects(
    f.service(id, {
      kind: 'submit',
      requestId: req(1),
      command: { kind: 'start', cardIds: [...team.slice(0, 5), 'base1-4'] },
    }),
    /invalid_team/,
  )
  const s = await f.service(id, {
    kind: 'submit',
    requestId: req(2),
    command: { kind: 'start', cardIds: team },
  })
  assert.ok(s.match)
  assert.equal('botAction' in s.match.session, false)
  assert.equal('botAction' in publicView(f.get()).match!.session, false)
  await assert.rejects(
    f.service(id, {
      kind: 'submit',
      requestId: req(3),
      command: {
        kind: 'turn',
        battleId: req(2),
        expectedRevision: 0,
        action: { kind: 'move', actorId: team[0], moveId: 'fake' },
      },
    }),
    /invalid_action/,
  )
  await assert.rejects(
    f.service(id, {
      kind: 'submit',
      requestId: req(3),
      command: { kind: 'turn', battleId: req(2), expectedRevision: 10, action: { kind: 'pass' } },
    }),
    /battle_conflict/,
  )
  assert.equal(f.writes(), 1)
})
test('identical request replays, conflicting reuse fails, cross-battle stale input cannot affect active match', async () => {
  const f = fixture(),
    start = {
      kind: 'submit' as const,
      requestId: req(1),
      command: { kind: 'start' as const, cardIds: team },
    }
  await f.service(id, start)
  await f.service(id, start)
  assert.equal(f.writes(), 1)
  await assert.rejects(
    f.service(id, { ...start, command: { kind: 'start', cardIds: [...team].reverse() } }),
    /request_conflict/,
  )
  await assert.rejects(
    f.service(id, {
      kind: 'submit',
      requestId: req(2),
      command: { kind: 'abandon', battleId: req(99), expectedRevision: 0 },
    }),
    /battle_conflict/,
  )
})
test('full server-run matches finish using only actions, persist all rounds and reward once', async () => {
  const f = fixture()
  // Give the player all six stronger variants in this isolated repository.
  // Actual known IDs from the roster, distinct species, high budgets.
  const { listPlayableCards } = await import('../src/battle/playable-roster.ts')
  const seen = new Set<number>()
  const cards = listPlayableCards().sort(
    (a, b) => b.maxHp + b.attack + b.defense + b.speed - a.maxHp - a.attack - a.defense - a.speed,
  )
  const owned = cards
    .filter((c) => {
      if (seen.has(c.speciesId)) return false
      seen.add(c.speciesId)
      return true
    })
    .slice(0, 6)
    .map((c) => c.id)
  f.get().owned = owned.map((card_id) => ({ card_id, quantity: 1 }))
  await f.service(id, {
    kind: 'submit',
    requestId: req(10),
    command: { kind: 'start', cardIds: owned },
  })
  let n = 11
  while (f.get().match!.status === 'active' && n < 200) {
    const m = f.get().match!,
      b = m.session.battle
    let command: BattleCommand
    if (b.phase === 'replacement') {
      command = {
        kind: 'replace',
        battleId: m.id,
        expectedRevision: m.revision,
        targetId: b.sides[0].fighters.find((c) => c.hp > 0)!.id,
      }
    } else {
      const mirror = structuredClone(b)
      mirror.sides = [mirror.sides[1], mirror.sides[0]]
      command = {
        kind: 'turn',
        battleId: m.id,
        expectedRevision: m.revision,
        action: chooseBotAction(mirror),
      }
    }
    const request = { kind: 'submit' as const, requestId: req(n++), command }
    parseView(await f.service(id, request), id)
    const count = f.writes()
    await f.service(id, request)
    assert.equal(f.writes(), count)
  }
  assert.equal(f.get().match!.status, 'finished')
  assert.ok(f.get().match!.session.rounds.length > 0)
  assert.equal(f.get().match!.session.battle.result?.kind, 'win')
  assert.equal(f.get().coins, 50)
})
test('a rules/data version mismatch is stopped, but abandonment remains possible', async () => {
  const f = fixture()
  await f.service(id, {
    kind: 'submit',
    requestId: req(1),
    command: { kind: 'start', cardIds: team },
  })
  f.get().match!.session.battle.dataVersion = 'old-data'
  await assert.rejects(
    f.service(id, {
      kind: 'submit',
      requestId: req(2),
      command: { kind: 'turn', battleId: req(1), expectedRevision: 0, action: { kind: 'pass' } },
    }),
    /version_mismatch/,
  )
  const end = await f.service(id, {
    kind: 'submit',
    requestId: req(3),
    command: { kind: 'abandon', battleId: req(1), expectedRevision: 0 },
  })
  assert.equal(end.match!.status, 'abandoned')
  assert.equal(end.coins, 0)
})
