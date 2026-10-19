import type { SupabaseClient } from '@supabase/supabase-js'
import type { SessionGateway } from './store.ts'
import { normalizeDisplayName, parseProfile } from './validation.ts'

export function createAccountGateway(client: SupabaseClient): SessionGateway {
  return {
    async currentUser() {
      const session = await client.auth.getSession()
      if (session.error) throw session.error
      if (!session.data.session) return null
      const { data, error } = await client.auth.getUser()
      if (error) throw error
      if (!data.user) return null
      return { id: data.user.id, email: data.user.email ?? '' }
    },
    async loadProfile(userId) {
      const { data, error } = await client.rpc('ensure_player_profile').single()
      if (error) throw error
      return parseProfile(data, userId)
    },
    listen(listener) {
      const { data } = client.auth.onAuthStateChange((event, session) =>
        listener(event, session?.user.id ?? null),
      )
      return () => data.subscription.unsubscribe()
    },
  }
}
export async function saveDisplayName(client: SupabaseClient, userId: string, input: string) {
  const name = normalizeDisplayName(input)
  if (!name) throw new Error('Invalid display name')
  const { data, error } = await client
    .from('player_profiles')
    .update({ display_name: name })
    .eq('id', userId)
    .select('id,display_name,created_at')
    .single()
  if (error) throw error
  return parseProfile(data, userId)
}
export function accountErrorCode(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined
  switch (code) {
    case 'invalid_credentials':
      return 'credentials'
    case 'email_not_confirmed':
      return 'unconfirmed'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rateLimit'
    case 'email_address_not_authorized':
    case 'email_address_invalid':
      return 'emailDelivery'
    case 'weak_password':
      return 'passwordLength'
    case 'same_password':
      return 'samePassword'
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return 'expiredLink'
    default:
      return 'request'
  }
}
