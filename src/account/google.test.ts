import test from 'node:test'
import assert from 'node:assert/strict'
import { googleSignInRequest, completeAccountAuthReturn } from './google.ts'

const auth = (session: unknown = { user: { id: 'test-user' } }, error: unknown = null) => ({
  initialize: async () => ({ error }),
  getSession: async () => ({ data: { session }, error: null }),
})

test('Google returns to the current account origin without carrying arbitrary paths or scopes', () => {
  assert.deepEqual(googleSignInRequest('https://lumemon.vercel.app'), {
    provider: 'google',
    options: {
      redirectTo: 'https://lumemon.vercel.app/cuenta',
      queryParams: { prompt: 'select_account' },
    },
  })
  assert.equal(
    googleSignInRequest('http://127.0.0.1:5174').options.redirectTo,
    'http://127.0.0.1:5174/cuenta',
  )
  for (const origin of [
    'javascript:alert(1)',
    'http://remote.test',
    'https://u:p@example.com',
    'https://example.com/evil',
    'https://example.com/?next=evil',
    'https://example.com/#fragment',
  ])
    assert.throws(() => googleSignInRequest(origin))
})

test('normal navigation and password recovery are not consumed as Google callbacks', async () => {
  const unused = {
    initialize: async () => {
      throw new Error('must not initialize')
    },
    getSession: auth().getSession,
  }
  for (const url of [
    'https://lumemon.vercel.app/cuenta',
    'https://lumemon.vercel.app/cuenta/recuperar?code=recovery',
    'https://lumemon.vercel.app/catalogo?error=bad',
  ])
    assert.equal(await completeAccountAuthReturn(unused, url), null)
})

test('a valid callback waits for SDK initialization before checking the recovered session', async () => {
  let initialized = false
  const sdk = {
    initialize: async () => {
      initialized = true
      return { error: null }
    },
    getSession: async () => {
      assert.equal(initialized, true)
      return { data: { session: { user: { id: 'test-user' } } }, error: null }
    },
  }
  assert.deepEqual(
    await completeAccountAuthReturn(
      sdk,
      'https://lumemon.vercel.app/cuenta?code=temporary&view=profile',
    ),
    { path: '/cuenta?view=profile', error: null },
  )
})

test('denied access is translated and raw provider details are removed from the return URL', async () => {
  for (const separator of ['?', '#']) {
    assert.deepEqual(
      await completeAccountAuthReturn(
        auth(null),
        'https://lumemon.vercel.app/cuenta' +
          separator +
          'error=access_denied&error_code=authorization_failed&error_description=private-details&error_uri=https://evil.test',
      ),
      { path: '/cuenta', error: 'oauthCancelled' },
    )
  }
})

test('failed code exchange shows a safe error and removes the unusable code', async () => {
  assert.deepEqual(
    await completeAccountAuthReturn(
      auth(null, { message: 'secret provider detail' }),
      'https://lumemon.vercel.app/cuenta?code=expired',
    ),
    { path: '/cuenta', error: 'authReturn' },
  )
})

test('a code without a recovered session cannot be treated as successful sign-in', async () => {
  assert.deepEqual(
    await completeAccountAuthReturn(
      auth(null),
      'https://lumemon.vercel.app/cuenta?code=missing-verifier',
    ),
    { path: '/cuenta', error: 'authReturn' },
  )
})

test('network failures during callback recovery remain retryable without exposing raw errors', async () => {
  const sdk = {
    initialize: async () => {
      throw new Error('private transport details')
    },
    getSession: auth().getSession,
  }
  assert.deepEqual(
    await completeAccountAuthReturn(sdk, 'https://lumemon.vercel.app/cuenta?code=temporary'),
    { path: '/cuenta', error: 'authReturn' },
  )
})

test('unknown provider errors and session errors never become successful callbacks', async () => {
  assert.deepEqual(
    await completeAccountAuthReturn(
      auth(),
      'https://lumemon.vercel.app/cuenta?error=unexpected&error_description=private',
    ),
    { path: '/cuenta', error: 'authReturn' },
  )
  const sdk = {
    initialize: auth().initialize,
    getSession: async () => ({ data: { session: null }, error: new Error('private') }),
  }
  assert.deepEqual(
    await completeAccountAuthReturn(sdk, 'https://lumemon.vercel.app/cuenta?code=temporary'),
    { path: '/cuenta', error: 'authReturn' },
  )
})

test('callback cleanup removes the SDK flow identifier without losing unrelated navigation', async () => {
  assert.deepEqual(
    await completeAccountAuthReturn(
      auth(),
      'https://lumemon.vercel.app/cuenta?code=temporary&sb_flow_id=one-use&view=profile#main',
    ),
    { path: '/cuenta?view=profile#main', error: null },
  )
})

test('the installed SDK builds a PKCE Google request without sending account credentials', async () => {
  const { createClient } = await import('@supabase/supabase-js')
  const storage = new Map<string, string>()
  const client = createClient(
    'https://example.supabase.co',
    'sb_publishable_test_key_not_a_real_credential',
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storage: {
          getItem: (key) => storage.get(key) ?? null,
          setItem: (key, value) => {
            storage.set(key, value)
          },
          removeItem: (key) => {
            storage.delete(key)
          },
        },
      },
      global: {
        fetch: async () => {
          throw new Error('No network is needed to start OAuth')
        },
      },
    },
  )
  const { data, error } = await client.auth.signInWithOAuth(
    googleSignInRequest('https://lumemon.vercel.app'),
  )
  assert.equal(error, null)
  assert.ok(data.url)
  const request = new URL(data.url)
  assert.equal(request.origin, 'https://example.supabase.co')
  assert.equal(request.pathname, '/auth/v1/authorize')
  assert.equal(request.searchParams.get('provider'), 'google')
  assert.equal(request.searchParams.get('code_challenge_method'), 's256')
  assert.match(request.searchParams.get('code_challenge') ?? '', /^[A-Za-z0-9_-]{43}$/)
  const callback = new URL(request.searchParams.get('redirect_to')!)
  assert.equal(callback.origin, 'https://lumemon.vercel.app')
  assert.equal(callback.pathname, '/cuenta')
  assert.equal(request.searchParams.has('access_token'), false)
  assert.equal(request.searchParams.has('client_secret'), false)
})
