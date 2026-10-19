import test from 'node:test'
import assert from 'node:assert/strict'
import { createSessionStore, type AccountUser, type SessionGateway } from './store.ts'
import type { PlayerProfile } from './validation.ts'
const user = { id: 'a', email: 'a@example.test' }
const profile = { id: 'a', displayName: 'Trainer', createdAt: '2026-10-19T00:00:00Z' }
const flush = () => new Promise<void>((resolve) => setImmediate(resolve))
function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
function setup() {
  let listener: (event: string, userId: string | null) => void = () => {}
  let identity: AccountUser | null = user
  let calls = 0
  let load: (id: string) => Promise<PlayerProfile> = async () => profile
  const gateway: SessionGateway = {
    currentUser: async () => identity,
    loadProfile: (id) => {
      calls++
      return load(id)
    },
    listen: (fn) => {
      listener = fn
      return () => {
        listener = () => {}
      }
    },
  }
  return {
    store: createSessionStore(gateway),
    setUser: (value: AccountUser | null) => {
      identity = value
    },
    setLoad: (fn: typeof load) => {
      load = fn
    },
    emit: (event: string) => listener(event, identity?.id ?? null),
    calls: () => calls,
  }
}
test('verified identity loads its private profile; signed out never queries a profile', async () => {
  const s = setup()
  const stop = s.store.start()
  await flush()
  assert.deepEqual(s.store.getSnapshot(), { status: 'ready', user, profile })
  s.setUser(null)
  s.emit('SIGNED_OUT')
  await flush()
  assert.deepEqual(s.store.getSnapshot(), { status: 'signedOut', user: null, profile: null })
  assert.equal(s.calls(), 1)
  stop()
})
test('late profile responses cannot restore an account after logout', async () => {
  const s = setup()
  const pending = deferred<PlayerProfile>()
  s.setLoad(() => pending.promise)
  const stop = s.store.start()
  await flush()
  s.setUser(null)
  s.emit('SIGNED_OUT')
  await flush()
  pending.resolve(profile)
  await flush()
  assert.equal(s.store.getSnapshot().status, 'signedOut')
  assert.equal(s.store.getSnapshot().profile, null)
  stop()
})
test('switching users clears prior data immediately and ignores an older profile', async () => {
  const s = setup()
  const old = deferred<PlayerProfile>()
  s.setLoad(() => old.promise)
  const stop = s.store.start()
  await flush()
  s.setUser({ id: 'b', email: 'b@example.test' })
  s.setLoad(async () => ({ ...profile, id: 'b', displayName: 'Player B' }))
  s.emit('SIGNED_IN')
  assert.equal(s.store.getSnapshot().profile, null)
  await flush()
  old.resolve(profile)
  await flush()
  assert.equal(s.store.getSnapshot().user?.id, 'b')
  assert.equal(s.store.getSnapshot().profile?.id, 'b')
  stop()
})
test('a mismatched profile or network failure never exposes data and retry recovers', async () => {
  const s = setup()
  s.setLoad(async () => ({ ...profile, id: 'someone-else' }))
  const stop = s.store.start()
  await flush()
  assert.equal(s.store.getSnapshot().status, 'error')
  assert.equal(s.store.getSnapshot().profile, null)
  s.setLoad(async () => {
    throw new Error('private backend detail')
  })
  await s.store.refresh()
  assert.deepEqual(s.store.getSnapshot(), { status: 'error', user: null, profile: null })
  s.setLoad(async () => profile)
  await s.store.refresh()
  assert.equal(s.store.getSnapshot().status, 'ready')
  stop()
})
test('stopping a subscription invalidates pending requests, including Strict Mode remounts', async () => {
  const s = setup()
  const pending = deferred<PlayerProfile>()
  const snapshots: string[] = []
  s.setLoad(() => pending.promise)
  const unsub = s.store.subscribe(() => snapshots.push(s.store.getSnapshot().status))
  const stop = s.store.start()
  await flush()
  stop()
  const count = snapshots.length
  pending.resolve(profile)
  await flush()
  assert.equal(snapshots.length, count)
  s.setUser(null)
  const stopAgain = s.store.start()
  await flush()
  assert.equal(s.store.getSnapshot().status, 'signedOut')
  stopAgain()
  unsub()
})

test('leaving the account route clears the cached identity before the next render', async () => {
  const s = setup()
  const stop = s.store.start()
  await flush()
  assert.equal(s.store.getSnapshot().user?.id, 'a')
  stop()
  s.setUser({ id: 'b', email: 'b@example.test' })
  assert.equal(s.store.getSnapshot().user, null)
  assert.equal(s.store.getSnapshot().profile, null)
})
test('ordinary events keep a verified same-user form mounted during revalidation', async () => {
  const s = setup()
  const stop = s.store.start()
  await flush()
  const states: string[] = []
  const unsubscribe = s.store.subscribe(() => states.push(s.store.getSnapshot().status))
  for (const event of ['SIGNED_IN', 'TOKEN_REFRESHED']) {
    const pending = deferred<PlayerProfile>()
    s.setLoad(() => pending.promise)
    s.emit(event)
    assert.equal(s.store.getSnapshot().status, 'ready')
    await flush()
    assert.equal(s.store.getSnapshot().status, 'ready')
    pending.resolve(profile)
    await flush()
  }
  assert.ok(states.every((status) => status === 'ready'))
  s.setUser({ id: 'b', email: 'b@example.test' })
  s.setLoad(async () => ({ ...profile, id: 'b' }))
  s.emit('SIGNED_IN')
  assert.equal(s.store.getSnapshot().user, null)
  await flush()
  assert.equal(s.store.getSnapshot().user?.id, 'b')
  unsubscribe()
  stop()
})
