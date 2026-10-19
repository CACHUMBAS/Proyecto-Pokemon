import test from 'node:test'
import assert from 'node:assert/strict'
import { readAccountConfig } from './config.ts'
import { normalizeDisplayName, validateCredentials, parseProfile } from './validation.ts'

const key = 'sb_publishable_test_key_not_a_real_credential'
test('configuration stays unavailable until both public connection values are valid', () => {
  assert.deepEqual(readAccountConfig(undefined, undefined), { kind: 'missing' })
  assert.equal(readAccountConfig('https://example.supabase.co', '').kind, 'invalid')
  assert.deepEqual(readAccountConfig(' https://example.supabase.co/ ', key), {
    kind: 'ready',
    config: { url: 'https://example.supabase.co', key },
  })
  for (const url of [
    'http://remote.example',
    'https://user:pass@example.com',
    'https://example.com/?token=x',
    'bad',
  ])
    assert.equal(readAccountConfig(url, key).kind, 'invalid')
})
test('browser configuration rejects server secrets and accepts only the legacy anon role', () => {
  const jwt = (role: string) =>
    'e30.' + Buffer.from(JSON.stringify({ role })).toString('base64url') + '.test'
  for (const value of ['sb_secret_test', jwt('service_role'), jwt('authenticated'), 'random'])
    assert.equal(readAccountConfig('https://example.supabase.co', value).kind, 'invalid')
  assert.equal(readAccountConfig('https://example.supabase.co', jwt('anon')).kind, 'ready')
})
test('credentials preserve passwords and distinguish sign-in from new password requirements', () => {
  assert.equal(validateCredentials('signin', ' a@example.com ', 'short'), null)
  assert.equal(validateCredentials('signup', 'a@example.com', 'short', 'short'), 'passwordLength')
  assert.equal(
    validateCredentials('signup', 'a@example.com', 'long password', 'long password'),
    null,
  )
  assert.equal(
    validateCredentials('signup', 'a@example.com', 'long password', 'wrong'),
    'passwordMatch',
  )
  assert.equal(validateCredentials('signin', 'bad', 'password'), 'email')
  assert.equal(validateCredentials('reset', 'a@example.com'), null)
  assert.equal(validateCredentials('updatePassword', '', 'new password', 'new password'), null)
  assert.equal(validateCredentials('signin', 'a@example.com', ''), 'passwordRequired')
})
test('display names have bounded Unicode length and reject control characters', () => {
  assert.equal(normalizeDisplayName('  Entrenador  '), 'Entrenador')
  assert.equal(normalizeDisplayName('🔥'.repeat(24)), '🔥'.repeat(24))
  for (const name of ['ab', ' '.repeat(5), 'x'.repeat(25), 'Mi\nNombre', 'abc\u0000def'])
    assert.equal(normalizeDisplayName(name), null)
})
test('profile data must match the verified identity and the database shape', () => {
  const data = { id: 'user-a', display_name: 'Trainer', created_at: '2026-10-19T00:00:00Z' }
  assert.deepEqual(parseProfile(data, 'user-a'), {
    id: 'user-a',
    displayName: 'Trainer',
    createdAt: '2026-10-19T00:00:00Z',
  })
  for (const value of [
    null,
    { ...data, id: 'user-b' },
    { ...data, display_name: 'x' },
    { ...data, created_at: 'bad' },
  ])
    assert.throws(() => parseProfile(value, 'user-a'))
})
