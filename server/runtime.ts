import { createClient } from '@supabase/supabase-js'
import { createHandler } from './http.ts'
import { createBattleService } from './online-battle.ts'
import type { BattleRepository, PrivateContext } from './online-battle.ts'
import { BattleFailure, failureCodes } from '../src/online-battle/protocol.ts'
export function configuredHandler(env: Record<string, string | undefined>) {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL,
    key = env.SUPABASE_SECRET_KEY
  if (!url || !key?.startsWith('sb_secret_')) return createHandler(null)
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  async function rpc(name: string, args: Record<string, unknown>): Promise<PrivateContext> {
    const { data, error } = await client.rpc(name, args)
    if (error) {
      const code = failureCodes.find((c) => c === error.message)
      throw new BattleFailure(code ?? 'unavailable')
    }
    if (!data || typeof data !== 'object') throw new BattleFailure('unavailable')
    return data as PrivateContext
  }
  const repo: BattleRepository = {
    read: (user, request) =>
      rpc('online_battle_read', { p_user_id: user, p_request_id: request ?? null }),
    write: (user, request, command, session) =>
      rpc('online_battle_write', {
        p_user_id: user,
        p_request_id: request,
        p_command: command,
        p_session: session,
      }),
  }
  return createHandler({
    authenticate: async (token) => {
      const { data, error } = await client.auth.getUser(token)
      return error ? null : (data.user?.id ?? null)
    },
    execute: createBattleService(repo),
  })
}
