import { createClient } from '@supabase/supabase-js'
import { readAccountConfig } from './config'
import { createAccountGateway } from './gateway'
import { createSessionStore } from './store'
import { createRecoveryGate } from './recovery'

export const accountConfig = readAccountConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
export const accountClient =
  accountConfig.kind === 'ready'
    ? createClient(accountConfig.config.url, accountConfig.config.key, {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null
export const recoveryGate = createRecoveryGate()
accountClient?.auth.onAuthStateChange((event, session) =>
  recoveryGate.onEvent(event, session?.user.id ?? null),
)
export const accountStore = accountClient
  ? createSessionStore(createAccountGateway(accountClient))
  : null
