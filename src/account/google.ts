export function googleSignInRequest(origin: string) {
  const url = new URL(origin)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('Invalid sign-in origin')
  return {
    provider: 'google' as const,
    options: { redirectTo: url.origin + '/cuenta', queryParams: { prompt: 'select_account' } },
  }
}

export type AuthReturnError = 'oauthCancelled' | 'authReturn'
type ReturnAuth = {
  initialize(): Promise<{ error: unknown }>
  getSession(): Promise<{ data: { session: unknown | null }; error: unknown }>
}

// Let the SDK complete PKCE before removing the one-use callback parameters.
// Neither a URL parameter nor this presentation helper establishes identity.
export async function completeAccountAuthReturn(
  auth: ReturnAuth,
  input: string,
): Promise<{ path: string; error: AuthReturnError | null } | null> {
  const url = new URL(input)
  if (url.pathname !== '/cuenta' && url.pathname !== '/cuenta/') return null
  const hash = new URLSearchParams(url.hash.slice(1))
  const params = new URLSearchParams([...url.searchParams, ...hash])
  if (!['code', 'error', 'error_code'].some((key) => params.has(key))) return null
  const keys = ['code', 'sb_flow_id', 'error', 'error_code', 'error_description', 'error_uri']
  const cleanHash = keys.some((key) => hash.has(key))
  for (const key of keys) {
    url.searchParams.delete(key)
    hash.delete(key)
  }
  if (cleanHash) url.hash = hash.toString()
  const path = url.pathname + url.search + url.hash
  try {
    const initialized = await auth.initialize()
    if (params.get('error') === 'access_denied') return { path, error: 'oauthCancelled' }
    if (initialized.error || params.has('error') || params.has('error_code'))
      return { path, error: 'authReturn' }
    const session = await auth.getSession()
    return { path, error: session.error || !session.data.session ? 'authReturn' : null }
  } catch {
    return { path, error: 'authReturn' }
  }
}
