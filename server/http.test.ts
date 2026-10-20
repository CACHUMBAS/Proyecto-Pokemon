import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHandler } from './http.ts'
const uid = 'bb200000-0000-4000-8000-000000000001'
const empty = {
  user_id: uid,
  version: 'lumemon-online-v1',
  owned: [],
  coins: 0,
  match: null,
  receipt: null,
} as const
test('HTTP authenticates before handling commands and never takes user ID from body', async () => {
  const calls: string[] = []
  const handler = createHandler({
    authenticate: async (token) => (token === 'valid' ? uid : null),
    execute: async (user) => {
      calls.push(user)
      return { ...empty, owned: [] }
    },
  })
  const req = (token: string, body: unknown) =>
    new Request('https://lumemon.test/api/battle', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  assert.equal((await handler(req('bad', { kind: 'load' }))).status, 401)
  assert.equal((await handler(req('valid', { kind: 'load', userId: 'other' }))).status, 400)
  const ok = await handler(req('valid', { kind: 'load' }))
  assert.equal(ok.status, 200)
  assert.deepEqual(calls, [uid])
  assert.equal(ok.headers.get('cache-control'), 'no-store')
  assert.equal((await handler(new Request('https://lumemon.test/api/battle'))).status, 405)
  assert.equal((await handler(req('valid', { x: 'a'.repeat(9000) }))).status, 413)
})
test('unconfigured and unexpected failures are generic and do not disclose infrastructure details', async () => {
  assert.equal(
    (await createHandler(null)(new Request('https://lumemon.test/api/battle', { method: 'POST' })))
      .status,
    503,
  )
  const handler = createHandler({
    authenticate: async () => uid,
    execute: async () => {
      throw Error('secret_internal_value')
    },
  })
  const r = await handler(
    new Request('https://lumemon.test/api/battle', {
      method: 'POST',
      headers: { Authorization: 'Bearer valid', 'Content-Type': 'application/json' },
      body: '{"kind":"load"}',
    }),
  )
  assert.equal(r.status, 503)
  assert.equal((await r.text()).includes('secret_internal_value'), false)
})
