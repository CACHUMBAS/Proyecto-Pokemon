export type AccountMode = 'signin' | 'signup' | 'reset' | 'updatePassword'
export type PlayerProfile = { id: string; displayName: string; createdAt: string }

export function normalizeDisplayName(value: string): string | null {
  const name = value.trim()
  const length = [...name].length
  const control = [...value].some((c) => c.codePointAt(0)! < 32 || c.codePointAt(0) === 127)
  return length >= 3 && length <= 24 && !control ? name : null
}
export function validateCredentials(
  mode: AccountMode,
  email: string,
  password = '',
  confirm = '',
): string | null {
  if (
    mode !== 'updatePassword' &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 254)
  )
    return 'email'
  if (mode === 'reset') return null
  if (!password) return 'passwordRequired'
  if (mode !== 'signin' && (password.length < 10 || password.length > 128)) return 'passwordLength'
  if (mode !== 'signin' && password !== confirm) return 'passwordMatch'
  return null
}
export function parseProfile(value: unknown, userId: string): PlayerProfile {
  if (!value || typeof value !== 'object') throw new Error('Invalid profile')
  const row = value as Record<string, unknown>
  if (
    row.id !== userId ||
    typeof row.display_name !== 'string' ||
    normalizeDisplayName(row.display_name) !== row.display_name ||
    typeof row.created_at !== 'string' ||
    !Number.isFinite(Date.parse(row.created_at))
  )
    throw new Error('Invalid profile')
  return { id: userId, displayName: row.display_name, createdAt: row.created_at }
}
