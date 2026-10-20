import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createOnlineStore } from './store.ts'
import { parseView } from './validation.ts'
import { createOnlineGateway } from './gateway.ts'
import { BattleFailure } from './protocol.ts'
import type { OnlineView, PendingBattle, BattleRequest } from './protocol.ts'
import type { SupabaseClient } from '@supabase/supabase-js'
const user = 'bb200000-0000-4000-8000-000000000001',
  rid = 'bb200000-0000-4000-8000-000000000002'
const team = ['base1-44', 'base1-46', 'base1-63', 'base1-58', 'base1-52', 'base2-51']
const data: OnlineView = {
  user_id: user,
  version: 'lumemon-online-v1',
  coins: 0,
  owned: [],
  match: null,
  receipt: null,
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
function storage() {
  let pending: PendingBattle | null = null
  return {
    read: () => pending,
    write: (p: PendingBattle) => {
      pending = p
    },
    clear: () => {
      pending = null
    },
  }
}
test('unknown response retries the same persisted UUID; reload clears only a matching receipt', async () => {
  const disk = storage(),
    requests: BattleRequest[] = []
  let failed = true
  const gateway = {
    async exchange(r: BattleRequest) {
      requests.push(r)
      if (r.kind === 'load') return structuredClone(data)
      assert.equal(disk.read()?.requestId, r.requestId)
      if (failed) {
        failed = false
        throw new BattleFailure('uncertain')
      }
      return { ...data, receipt: { requestId: r.requestId, command: r.command } }
    },
  }
  const s = createOnlineStore(gateway, disk, () => rid),
    stop = s.start()
  await tick()
  await s.submit({ kind: 'start', cardIds: team })
  assert.equal(s.getSnapshot().pending?.requestId, rid)
  await s.retry()
  assert.equal(s.getSnapshot().pending, null)
  assert.equal(requests.filter((r) => r.kind === 'submit').length, 2)
  stop()
  disk.write({ requestId: rid, command: { kind: 'start', cardIds: team } })
  const recovered = createOnlineStore(
    { exchange: async () => ({ ...data, receipt: disk.read() }) },
    disk,
  )
  const end = recovered.start()
  await tick()
  assert.equal(recovered.getSnapshot().pending, null)
  assert.equal(disk.read(), null)
  end()
})
test('failed persistence prevents sending; double clicks send once; logout discards late replies', async () => {
  let sent = 0,
    resolve: ((value: OnlineView) => void) | undefined
  const s = createOnlineStore(
    {
      exchange: async (r) => {
        if (r.kind === 'load') return data
        sent++
        return new Promise((res) => {
          resolve = res
        })
      },
    },
    storage(),
    () => rid,
  )
  const stop = s.start()
  await tick()
  const one = s.submit({ kind: 'start', cardIds: team })
  await s.submit({ kind: 'start', cardIds: team })
  assert.equal(sent, 1)
  stop()
  resolve!({ ...data, receipt: { requestId: rid, command: { kind: 'start', cardIds: team } } })
  await one
  assert.equal(s.getSnapshot().data, null)
  const broken = storage()
  broken.write = () => {
    throw Error('blocked')
  }
  const b = createOnlineStore(
    {
      exchange: async () => {
        sent++
        return data
      },
    },
    broken,
    () => rid,
  )
  const close = b.start()
  await tick()
  const before = sent
  await b.submit({ kind: 'start', cardIds: team })
  assert.equal(sent, before)
  assert.equal(b.getSnapshot().error, 'storage')
  close()
})
test('conflicts reload authoritative data; mismatched receipt never clears pending', async () => {
  const disk = storage(),
    s = createOnlineStore(
      {
        exchange: async (r) => {
          if (r.kind === 'load') return data
          throw new BattleFailure('battle_conflict')
        },
      },
      disk,
      () => rid,
    )
  const stop = s.start()
  await tick()
  await s.submit({ kind: 'abandon', battleId: rid, expectedRevision: 0 })
  assert.equal(s.getSnapshot().pending, null)
  assert.equal(s.getSnapshot().error, 'battle_conflict')
  stop()
  const b = createOnlineStore(
    { exchange: async (r) => (r.kind === 'load' ? data : { ...data, receipt: null }) },
    disk,
    () => rid,
  )
  const end = b.start()
  await tick()
  await b.submit({ kind: 'start', cardIds: team })
  assert.equal(b.getSnapshot().pending?.requestId, rid)
  end()
})
test('parser rejects another identity, coerced balances and unknown cards', () => {
  assert.deepEqual(parseView(data, user), data)
  for (const malformed of [
    { ...data, user_id: rid },
    { ...data, coins: '50' },
    { ...data, coins: -1 },
    { ...data, owned: [{ card_id: 'fake', quantity: 1 }] },
  ]) {
    assert.throws(() => parseView(malformed, user), /invalid_data/)
  }
})
test('gateway pins bearer identity and detects missing API / HTML responses', async () => {
  let sent = 0
  const client = {
    auth: {
      getSession: async () => ({ data: { session: { access_token: 'token' } } }),
      getUser: async () => ({ data: { user: { id: user } } }),
    },
  } as unknown as SupabaseClient
  const g = createOnlineGateway(client, user, async (_url, init) => {
    sent++
    assert.equal((init!.headers as Record<string, string>).Authorization, 'Bearer token')
    return Response.json(data)
  })
  assert.equal((await g.exchange({ kind: 'load' })).user_id, user)
  const wrong = createOnlineGateway(client, rid, async () => {
    sent++
    return Response.json(data)
  })
  await assert.rejects(wrong.exchange({ kind: 'load' }), /identity/)
  assert.equal(sent, 1)
  const html = createOnlineGateway(
    client,
    user,
    async () => new Response('<html/>', { headers: { 'content-type': 'text/html' } }),
  )
  await assert.rejects(html.exchange({ kind: 'load' }), /unavailable/)
})
