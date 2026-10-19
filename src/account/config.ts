export type AccountConfig = { url: string; key: string }
export type ConfigResult =
  { kind: 'missing' | 'invalid' } | { kind: 'ready'; config: AccountConfig }

function isPublicKey(key: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) return true
  try {
    const parts = key.split('.')
    if (parts.length !== 3) return false
    // A configuration guard only; Auth and Postgres verify actual tokens.
    const encoded = parts[1].replaceAll('-', '+').replaceAll('_', '/')
    return JSON.parse(atob(encoded)).role === 'anon'
  } catch {
    return false
  }
}
export function readAccountConfig(url: unknown, key: unknown): ConfigResult {
  if (!url && !key) return { kind: 'missing' }
  if (typeof url !== 'string' || typeof key !== 'string' || !isPublicKey(key.trim()))
    return { kind: 'invalid' }
  try {
    const parsed = new URL(url.trim())
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== '/'
    )
      return { kind: 'invalid' }
    return { kind: 'ready', config: { url: parsed.origin, key: key.trim() } }
  } catch {
    return { kind: 'invalid' }
  }
}
