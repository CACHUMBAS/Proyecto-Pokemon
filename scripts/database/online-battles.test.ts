import { before, after, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { createPractice } from '../../src/battle/practice.ts'
const db = new PGlite()
const uid = (n: number) => 'bb200000-0000-4000-8000-' + String(n).padStart(12, '0')
const team = ['base1-44', 'base1-46', 'base1-63', 'base1-58', 'base1-52', 'base2-51']
let serial = 0
before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as
 'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
 grant usage on schema auth to authenticated, anon;`)
  for (const name of [
    '202610190001_player_profiles',
    '202610200001_collection',
    '202610200002_online_battles',
  ]) {
    const file = new URL('../../supabase/migrations/' + name + '.sql', import.meta.url)
    if (existsSync(file)) await db.exec(readFileSync(file, 'utf8'))
  }
})
after(() => db.close())
async function rpc(name: string, args: unknown[] = []) {
  const r = await db.query<{ value: Record<string, unknown> }>(
    'select public.' + name + '(' + args.map((_, i) => '$' + (i + 1)).join(',') + ') as value',
    args,
  )
  return r.rows[0].value
}
async function player() {
  await db.exec('reset role')
  const id = uid(++serial)
  await db.query('insert into auth.users(id) values ($1)', [id])
  await db.exec('set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id])
  await rpc('claim_collection_starter', ['alba', uid(1000 + serial)])
  await db.exec('set role service_role')
  return id
}
function start(id: string, request: string, cards = team) {
  return rpc('online_battle_write', [
    id,
    request,
    { kind: 'start', cardIds: cards },
    createPractice(request, team, false, 'rookie', [], []),
  ])
}
const load = (id: string, req: string | null = null) => rpc('online_battle_read', [id, req])
const match = (r: Record<string, unknown>) =>
  r.match as {
    id: string
    revision: number
    status: string
    session: ReturnType<typeof createPractice>
    reward: number
  }
function finish(id: string, battle: string, request: string, winner: 0 | 1 | null = 0) {
  const s = createPractice(battle, team, false, 'rookie', [], [])
  s.battle.phase = 'finished'
  s.battle.result =
    winner === null
      ? { kind: 'draw', reason: 'turn-limit' }
      : { kind: 'win', winner, reason: 'knockout' }
  return rpc('online_battle_write', [
    id,
    request,
    { kind: 'turn', battleId: battle, expectedRevision: 0, action: { kind: 'pass' } },
    s,
  ])
}
test('private battle RPC exists and is inaccessible to clients', async () => {
  const r = await db.query<{ ready: boolean }>(
    "select to_regprocedure('public.online_battle_read(uuid,uuid)') is not null as ready",
  )
  assert.equal(r.rows[0].ready, true)
  for (const role of ['anon', 'authenticated']) {
    await db.exec('set role ' + role)
    await assert.rejects(load(uid(1)), /permission denied/)
    await assert.rejects(start(uid(1), uid(2)), /permission denied/)
    await assert.rejects(
      db.query('select * from lumemon_internal.online_battles'),
      /permission denied/,
    )
  }
})
test('start checks ownership, six species and one active match; replays identical UUID', async () => {
  const id = await player()
  await assert.rejects(start(id, uid(200), [...team.slice(0, 5), 'base1-4']), /invalid_team/)
  await assert.rejects(start(id, uid(200), [...team.slice(0, 5), team[0]]), /invalid_team/)
  const a = await start(id, uid(201))
  assert.equal(match(a).revision, 0)
  assert.equal(match(await start(id, uid(201))).id, uid(201))
  await assert.rejects(start(id, uid(201), [...team].reverse()), /request_conflict/)
  await assert.rejects(start(id, uid(202)), /active_battle/)
})
test('win credits 50 exactly once, stale revisions cannot advance, receipt survives newer commands', async () => {
  const id = await player(),
    battle = uid(300)
  await start(id, battle)
  const a = await finish(id, battle, uid(301))
  assert.equal(a.coins, 50)
  assert.equal(match(a).reward, 50)
  assert.equal((await finish(id, battle, uid(301))).coins, 50)
  await assert.rejects(finish(id, battle, uid(302)), /battle_conflict/)
  await start(id, uid(303))
  assert.equal(match(await load(id, uid(301))).id, battle)
  const b = await finish(id, uid(303), uid(304))
  assert.equal(b.coins, 100)
  await db.exec('set role authenticated')
  const pack = await rpc('open_collection_pack', ['prisma-v1', 'coins', uid(305)])
  assert.equal(pack.coins_delta, -100)
})
test('loss, draw and abandon give zero, even on retry', async () => {
  for (const winner of [1, null] as const) {
    const id = await player(),
      battle = uid(400 + serial * 10)
    await start(id, battle)
    const a = await finish(id, battle, uid(401 + serial * 10), winner)
    assert.equal(a.coins, 0)
    assert.equal(match(a).reward, 0)
  }
  const id = await player(),
    battle = uid(500)
  await start(id, battle)
  const command = { kind: 'abandon', battleId: battle, expectedRevision: 0 }
  for (let i = 0; i < 2; i++) {
    const a = await rpc('online_battle_write', [id, uid(501), command, null])
    assert.equal(a.coins, 0)
    assert.equal(match(a).status, 'abandoned')
  }
})
test('cross-user battle IDs and command UUIDs cannot read or change another account', async () => {
  const a = await player()
  await start(a, uid(600))
  const b = await player()
  assert.equal((await load(b, uid(600))).match, null)
  await assert.rejects(finish(b, uid(600), uid(601)), /battle_conflict/)
  assert.equal(match(await load(a)).id, uid(600))
})

// Real engine + real SQL transaction boundary, including simultaneous optimistic commits.
test('complete matches through service/SQL earn two rewards and buy one pack; concurrent final actions cannot double credit', async () => {
  const { createBattleService } = await import('../../server/online-battle.ts')
  const { listPlayableCards } = await import('../../src/battle/playable-roster.ts')
  const { chooseBotAction } = await import('../../src/battle/bot.ts')
  const { practiceReducer } = await import('../../src/battle/practice.ts')
  const { parseView } = await import('../../src/online-battle/validation.ts')
  const { BattleFailure } = await import('../../src/online-battle/protocol.ts')
  const id = await player(),
    seen = new Set<number>()
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
  await db.exec('reset role')
  for (const card of owned)
    await db.query(
      'insert into public.player_inventory(user_id,card_id,quantity) values($1,$2,1) on conflict do nothing',
      [id, card],
    )
  await db.exec('set role service_role')
  const service = createBattleService(
    {
      read: async (user, request) =>
        (await rpc('online_battle_read', [
          user,
          request ?? null,
        ])) as unknown as import('../../server/online-battle.ts').PrivateContext,
      write: async (user, request, command, session) => {
        try {
          return (await rpc('online_battle_write', [
            user,
            request,
            command,
            session,
          ])) as unknown as import('../../server/online-battle.ts').PrivateContext
        } catch (error) {
          if ((error as Error).message === 'battle_conflict')
            throw new BattleFailure('battle_conflict')
          throw error
        }
      },
    },
    () => 0,
  )
  let counter = 2000,
    conflicts = 0
  for (let game = 0; game < 2; game++) {
    let view = await service(id, {
      kind: 'submit',
      requestId: uid(counter++),
      command: { kind: 'start', cardIds: owned },
    })
    while (view.match!.status === 'active' && counter < 2400) {
      const m = view.match!,
        b = m.session.battle
      const base = { battleId: m.id, expectedRevision: m.revision }
      let command: import('../../src/online-battle/protocol.ts').BattleCommand
      if (b.phase === 'replacement')
        command = {
          ...base,
          kind: 'replace',
          targetId: b.sides[0].fighters.find((f) => f.hp > 0)!.id,
        }
      else {
        const mirrored = structuredClone(b)
        mirrored.sides = [mirrored.sides[1], mirrored.sides[0]]
        command = { ...base, kind: 'turn', action: chooseBotAction(mirrored) }
      }
      const context = await load(id),
        stored = match(context).session
      const predicted = practiceReducer(
        stored,
        command.kind === 'turn'
          ? {
              kind: 'turn',
              battleId: m.id,
              expectedVersion: b.version,
              action: command.action,
              tieBreak: 0,
            }
          : {
              kind: 'replace',
              battleId: m.id,
              expectedVersion: b.version,
              targetId: command.targetId,
            },
      )!
      const request = { kind: 'submit' as const, requestId: uid(counter++), command }
      if (predicted.battle.phase === 'finished') {
        const results = await Promise.allSettled([
          service(id, request),
          service(id, { ...request, requestId: uid(counter++) }),
        ])
        assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1)
        const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult
        assert.match(rejected.reason.message, /battle_conflict/)
        conflicts++
        view = await service(id, { kind: 'load' })
      } else view = await service(id, request)
      parseView(view, id)
    }
    assert.equal(view.match!.status, 'finished')
    assert.equal(view.coins, 50 * (game + 1))
  }
  assert.equal(conflicts, 2)
  await db.exec('set role authenticated')
  const pack = await rpc('open_collection_pack', ['prisma-v1', 'coins', uid(2500)])
  assert.equal(pack.coins_delta, -100)
  assert.equal((pack.card_ids as string[]).length, 3)
})

test('operator smoke script verifies permissions and rolls its data back', async () => {
  await db.exec('reset role')
  const result = await db.exec(
    readFileSync(new URL('../../supabase/tests/online_battles.sql', import.meta.url), 'utf8'),
  )
  assert.ok(result.length > 0)
  const users = await db.query(
    "select id from auth.users where id='bbcf0000-0000-4000-8000-000000000001'",
  )
  assert.equal(users.rows.length, 0)
})
