import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
const db = new PGlite()
let serial = 0
const uuid = (n: number) => 'aa200000-0000-4000-8000-' + String(n).padStart(12, '0')
before(async () => {
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      'select nullif(current_setting(''request.jwt.claim.sub'',true),'''')::uuid';
    grant usage on schema auth to authenticated, anon;
  `)
  await db.exec(
    readFileSync(
      new URL('../../supabase/migrations/202610190001_player_profiles.sql', import.meta.url),
      'utf8',
    ),
  )
  await db.exec(
    readFileSync(
      new URL('../../supabase/migrations/202610200001_collection.sql', import.meta.url),
      'utf8',
    ),
  )
})
after(() => db.close())
async function player() {
  await db.exec('reset role')
  const id = uuid(++serial)
  await db.query('insert into auth.users(id) values ($1)', [id])
  await db.exec('set role authenticated')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id])
  return id
}
async function rpc(name: string, args: unknown[] = []) {
  const result = await db.query<{ value: Record<string, unknown> }>(
    'select public.' + name + '(' + args.map((_, i) => '$' + (i + 1)).join(',') + ') as value',
    args,
  )
  return result.rows[0].value
}
const state = () => rpc('get_player_collection')
const initial = (n: number, kit = 'alba') => rpc('claim_collection_starter', [kit, uuid(n)])
const open = (n: number, currency = 'welcome') =>
  rpc('open_collection_pack', ['prisma-v1', currency, uuid(n)])
const qty = (s: Record<string, unknown>) =>
  (s.inventory as { quantity: number }[]).reduce((sum, r) => sum + r.quantity, 0)
const wallet = (s: Record<string, unknown>) =>
  s.wallet as {
    coins: number
    fragments: number
    welcome_available: boolean
    starter_id: string | null
  }
test('database exposes the authenticated collection contract', async () => {
  const r = await db.query<{ ready: boolean }>(
    "select to_regprocedure('public.get_player_collection()') is not null as ready",
  )
  assert.equal(r.rows[0].ready, true)
})
test('initial kit is unique, replayable and does not manufacture currency', async () => {
  const id = await player()
  const empty = await state()
  assert.equal(empty.user_id, id)
  assert.equal(qty(empty), 0)
  const receipt = await initial(100)
  assert.deepEqual(await initial(100), receipt)
  await assert.rejects(initial(101), /starter_claimed/)
  await assert.rejects(initial(100, 'brasa'), /request_conflict/)
  const s = await state()
  assert.equal(qty(s), 6)
  assert.equal(wallet(s).coins, 0)
  assert.equal(wallet(s).fragments, 0)
  assert.equal(wallet(s).welcome_available, true)
  assert.equal((s.cards as unknown[]).length, 48)
  assert.equal((s.starters as unknown[]).length, 3)
})
test('welcome pack grants three cards once and replay keeps the same random result', async () => {
  await player()
  await assert.rejects(open(201), /starter_required/)
  await initial(200)
  const receipt = await open(201)
  assert.equal((receipt.card_ids as string[]).length, 3)
  assert.deepEqual(await open(201), receipt)
  await assert.rejects(open(202), /welcome_used/)
  await assert.rejects(open(201, 'coins'), /request_conflict/)
  const s = await state()
  assert.equal(qty(s), 9)
  assert.equal(wallet(s).welcome_available, false)
  assert.equal((s.events as unknown[]).length, 2)
})
test('insufficient funds leave cards, wallet and ledger unchanged; paid pack charges once', async () => {
  const id = await player()
  await initial(300)
  const before = await state()
  await assert.rejects(open(301, 'coins'), /insufficient_balance/)
  assert.deepEqual(await state(), before)
  await db.exec('reset role')
  await db.query('update public.player_wallets set coins=100 where user_id=$1', [id])
  await db.exec('set role authenticated')
  const result = await open(301, 'coins')
  assert.equal(result.coins_delta, -100)
  assert.deepEqual(await open(301, 'coins'), result)
  await assert.rejects(open(302, 'coins'), /insufficient_balance/)
  assert.equal(qty(await state()), 9)
  assert.equal(wallet(await state()).coins, 0)
})
test('fragmenting preserves the last copy, validates quantities and is idempotent', async () => {
  const id = await player()
  await initial(400)
  await assert.rejects(rpc('fragment_collection_card', ['base1-44', 1, uuid(401)]), /last_copy/)
  await assert.rejects(
    rpc('fragment_collection_card', ['base1-44', -1, uuid(401)]),
    /invalid_quantity/,
  )
  await assert.rejects(rpc('fragment_collection_card', ['unknown', 1, uuid(401)]), /unknown_card/)
  await db.exec('reset role')
  await db.query(
    "update public.player_inventory set quantity=2 where user_id=$1 and card_id='base1-44'",
    [id],
  )
  await db.exec('set role authenticated')
  const receipt = await rpc('fragment_collection_card', ['base1-44', 1, uuid(401)])
  assert.equal(receipt.fragments_delta, 5)
  assert.deepEqual(await rpc('fragment_collection_card', ['base1-44', 1, uuid(401)]), receipt)
  assert.equal(wallet(await state()).fragments, 5)
  assert.equal(qty(await state()), 6)
  await assert.rejects(rpc('fragment_collection_card', ['base1-44', 1, uuid(402)]), /last_copy/)
  await assert.rejects(open(401), /request_conflict/)
})
test('shard payment uses only fragments; bad parameters never debit the wallet', async () => {
  const id = await player()
  await initial(500)
  await db.exec('reset role')
  await db.query('update public.player_wallets set fragments=60 where user_id=$1', [id])
  await db.exec('set role authenticated')
  const before = await state()
  await assert.rejects(open(501, 'mixed'), /invalid_currency/)
  await assert.rejects(
    rpc('open_collection_pack', ['fake', 'fragments', uuid(501)]),
    /unknown_pack/,
  )
  await assert.rejects(
    rpc('open_collection_pack', ['prisma-v1', 'fragments', null]),
    /invalid_request/,
  )
  assert.deepEqual(await state(), before)
  assert.equal((await open(501, 'fragments')).fragments_delta, -60)
  assert.equal(wallet(await state()).fragments, 0)
  assert.equal(wallet(await state()).coins, 0)
})
test('private inventory, wallet and receipts are isolated and direct writes denied', async () => {
  const a = await player()
  await initial(600)
  const b = await player()
  await state()
  const r = await db.query<{ user_id: string }>('select user_id from public.player_wallets')
  assert.deepEqual(
    r.rows.map((row) => row.user_id),
    [b],
  )
  assert.equal((await db.query('select * from public.player_inventory')).rows.length, 0)
  assert.equal((await db.query('select * from public.player_collection_events')).rows.length, 0)
  for (const sql of [
    'update public.player_wallets set coins=999',
    'delete from public.player_inventory',
    "insert into public.player_inventory(user_id,card_id,quantity) values ('" +
      b +
      "','base1-44',5)",
    'update public.collection_cards set fragment_value=999',
    "update public.player_collection_events set response='{}'",
  ])
    await assert.rejects(db.exec(sql), /permission denied/)
  assert.equal(a === b, false)
  await db.exec('set role anon')
  for (const sql of [
    'select * from public.player_wallets',
    'select public.get_player_collection()',
    'select * from public.player_collection_events',
  ])
    await assert.rejects(db.exec(sql), /permission denied/)
})
test('failed inventory grant rolls back payment and request receipt', async () => {
  const id = await player()
  await initial(700)
  await db.exec('reset role')
  await db.query('update public.player_wallets set coins=100 where user_id=$1', [id])
  await db.query(
    `insert into public.player_inventory(user_id,card_id,quantity)
    select $1,card_id,1000000 from public.collection_cards
    on conflict(user_id,card_id) do update set quantity=1000000`,
    [id],
  )
  await db.exec('set role authenticated')
  const before = await state()
  await assert.rejects(open(701, 'coins'), /check constraint/)
  assert.deepEqual(await state(), before)
})
test('SQL deployment smoke test can be executed and rolls back its fixtures', async () => {
  await db.exec('reset role')
  const sql = readFileSync(new URL('../../supabase/tests/collection.sql', import.meta.url), 'utf8')
  await db.exec(sql)
  const r = await db.query<{ n: number }>(
    "select count(*)::int n from auth.users where id::text like 'aac00000-%'",
  )
  assert.equal(r.rows[0].n, 0)
})
