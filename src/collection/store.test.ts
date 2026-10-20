import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCollectionStore } from './store.ts'
import { collectionFixture, receiptFixture, TEST_REQUEST } from './fixtures.ts'
import {
  CollectionFailure,
  type PendingOperation,
  type CollectionGateway,
  type CollectionReceipt,
} from './types.ts'
const flush = () => new Promise<void>((r) => setImmediate(r))
function setup() {
  let saved: PendingOperation | null = null
  let loads = async () => collectionFixture()
  let calls = 0
  let execute: CollectionGateway['execute'] = async () => receiptFixture()
  const storage = {
    read: () => saved,
    write: (p: PendingOperation) => {
      saved = p
    },
    clear: () => {
      saved = null
    },
  }
  const gateway = {
    load: () => loads(),
    execute: (c: PendingOperation['command'], id: string) => {
      calls++
      return execute(c, id)
    },
  }
  return {
    storage,
    gateway,
    store: createCollectionStore(gateway, storage, () => TEST_REQUEST),
    saved: () => saved,
    calls: () => calls,
    setLoad: (f: typeof loads) => {
      loads = f
    },
    setExecute: (f: typeof execute) => {
      execute = f
    },
  }
}
test('double submission grants once and confirms via a fresh server snapshot', async () => {
  const s = setup()
  const stop = s.store.start()
  await flush()
  let resolve!: (r: CollectionReceipt) => void
  s.setExecute(
    () =>
      new Promise((r) => {
        resolve = r
      }),
  )
  const first = s.store.submit({ kind: 'starter', starterId: 'alba' })
  await s.store.submit({ kind: 'starter', starterId: 'alba' })
  assert.equal(s.calls(), 1)
  assert.equal(s.saved()?.requestId, TEST_REQUEST)
  resolve(receiptFixture())
  await first
  assert.equal(s.store.getSnapshot().receipt?.request_id, TEST_REQUEST)
  assert.equal(s.saved(), null)
  stop()
})
test('uncertain response retries exactly the same persisted command and request', async () => {
  const s = setup()
  const stop = s.store.start()
  await flush()
  s.setExecute(async () => {
    throw new Error('network private detail')
  })
  await s.store.submit({ kind: 'starter', starterId: 'alba' })
  assert.equal(s.store.getSnapshot().error, 'uncertain')
  const pending = s.saved()
  await s.store.submit({ kind: 'pack', packId: 'prisma-v1', currency: 'welcome' })
  assert.equal(s.calls(), 1)
  s.setExecute(async (c, id) => {
    assert.deepEqual(c, pending?.command)
    assert.equal(id, TEST_REQUEST)
    return receiptFixture()
  })
  await s.store.retry()
  assert.equal(s.calls(), 2)
  assert.equal(s.saved(), null)
  stop()
})
test('a reload recovers an already committed receipt without executing again', async () => {
  const s = setup()
  s.storage.write({ requestId: TEST_REQUEST, command: { kind: 'starter', starterId: 'alba' } })
  s.setLoad(async () => ({ ...collectionFixture(), events: [receiptFixture()] }))
  const stop = s.store.start()
  await flush()
  assert.equal(s.calls(), 0)
  assert.equal(s.saved(), null)
  assert.equal(s.store.getSnapshot().receipt?.request_id, TEST_REQUEST)
  stop()
})
test('stopping removes private data and discards late operation responses', async () => {
  const s = setup()
  const stop = s.store.start()
  await flush()
  let resolve!: (r: CollectionReceipt) => void
  s.setExecute(
    () =>
      new Promise((r) => {
        resolve = r
      }),
  )
  const submit = s.store.submit({ kind: 'starter', starterId: 'alba' })
  stop()
  resolve(receiptFixture())
  await submit
  assert.equal(s.store.getSnapshot().data, null)
  assert.equal(s.store.getSnapshot().receipt, null)
  assert.notEqual(s.saved(), null)
})
test('known rejection reloads balances; a failed refresh never permits stale spending', async () => {
  const s = setup()
  const stop = s.store.start()
  await flush()
  s.setExecute(async () => {
    throw new CollectionFailure('insufficient_balance')
  })
  await s.store.submit({ kind: 'pack', packId: 'prisma-v1', currency: 'coins' })
  assert.equal(s.store.getSnapshot().error, 'insufficient_balance')
  assert.equal(s.saved(), null)
  s.setLoad(async () => {
    throw new Error('offline')
  })
  await s.store.refresh()
  assert.equal(s.store.getSnapshot().data, null)
  await s.store.submit({ kind: 'starter', starterId: 'alba' })
  assert.equal(s.calls(), 1)
  stop()
})
test('storage failure prevents a request that could not be retried safely', async () => {
  const s = setup()
  s.storage.write = () => {
    throw new Error('blocked')
  }
  const stop = s.store.start()
  await flush()
  await s.store.submit({ kind: 'starter', starterId: 'alba' })
  assert.equal(s.calls(), 0)
  assert.equal(s.store.getSnapshot().error, 'storage')
  stop()
})
