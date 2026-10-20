import type { SupabaseClient } from '@supabase/supabase-js'
import { BattleFailure, failureCodes, parsePending } from './protocol.ts'
import type { BattleRequest, OnlineView, PendingBattle } from './protocol.ts'
import { parseView } from './validation.ts'
export interface OnlineGateway {
  exchange(request: BattleRequest): Promise<OnlineView>
}
export interface BattleStorage {
  read(): PendingBattle | null
  write(value: PendingBattle): void
  clear(): void
}
export function createOnlineGateway(
  client: SupabaseClient,
  userId: string,
  send: typeof fetch = fetch,
): OnlineGateway {
  return {
    async exchange(request) {
      const abort = new AbortController(),
        timer = setTimeout(() => abort.abort(), 20000)
      try {
        const { data, error } = await client.auth.getSession(),
          token = data.session?.access_token
        if (error || !token) throw new BattleFailure('identity')
        const verified = await client.auth.getUser(token)
        if (verified.error || verified.data.user?.id !== userId) throw new BattleFailure('identity')
        const response = await send('/api/battle', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: abort.signal,
          cache: 'no-store',
        })
        if (!response.headers.get('content-type')?.includes('application/json'))
          throw new BattleFailure('unavailable')
        const body = await response.json()
        if (!response.ok) {
          const code = failureCodes.find((c) => c === body?.error)
          throw new BattleFailure(code ?? 'uncertain')
        }
        return parseView(body, userId)
      } catch (e) {
        throw e instanceof BattleFailure ? e : new BattleFailure('uncertain')
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
export function battleStorage(userId: string): BattleStorage {
  const key = 'lumemon.online-battle.request.v1.' + userId
  return {
    read() {
      const raw = sessionStorage.getItem(key)
      return raw ? parsePending(JSON.parse(raw)) : null
    },
    write(v) {
      sessionStorage.setItem(key, JSON.stringify(v))
    },
    clear() {
      sessionStorage.removeItem(key)
    },
  }
}
