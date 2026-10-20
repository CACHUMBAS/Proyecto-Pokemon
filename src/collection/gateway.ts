import type { SupabaseClient } from '@supabase/supabase-js'
import { parseCollection, parseReceipt, parsePending } from './validation.ts'
import {
  CollectionFailure,
  type CollectionGateway,
  type CollectionCommand,
  type PendingStorage,
  type CollectionFailureCode,
} from './types.ts'
const businessCodes: CollectionFailureCode[] = [
  'insufficient_balance',
  'starter_claimed',
  'starter_required',
  'welcome_used',
  'last_copy',
  'request_conflict',
]
function mappedError(error: unknown): CollectionFailure {
  if (error instanceof CollectionFailure) return error
  const e =
    error && typeof error === 'object' ? (error as { code?: unknown; message?: unknown }) : {}
  if (['PGRST202', '42P01', '42883'].includes(String(e.code)))
    return new CollectionFailure('unavailable')
  const business = businessCodes.find((code) => e.message === code)
  return new CollectionFailure(business ?? 'request')
}
export function createCollectionGateway(client: SupabaseClient, userId: string): CollectionGateway {
  async function rpc(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    try {
      const { data: session, error: sessionError } = await client.auth.getSession()
      if (sessionError) throw sessionError
      const token = session.session?.access_token
      if (!token) throw new CollectionFailure('identity')
      const verified = await client.auth.getUser(token)
      if (verified.error || verified.data.user?.id !== userId)
        throw new CollectionFailure('identity')
      // Pin the validated token: another tab changing accounts cannot redirect this request.
      const { data, error } = await client
        .rpc(name, args)
        .setHeader('Authorization', 'Bearer ' + token)
      if (error) throw error
      return data
    } catch (cause) {
      throw mappedError(cause)
    }
  }
  return {
    async load() {
      return parseCollection(await rpc('get_player_collection'), userId)
    },
    async execute(command: CollectionCommand, requestId: string) {
      parsePending({ requestId, command })
      const [name, args] =
        command.kind === 'starter'
          ? ([
              'claim_collection_starter',
              { p_starter_id: command.starterId, p_request_id: requestId },
            ] as const)
          : command.kind === 'pack'
            ? ([
                'open_collection_pack',
                {
                  p_pack_id: command.packId,
                  p_currency: command.currency,
                  p_request_id: requestId,
                },
              ] as const)
            : ([
                'fragment_collection_card',
                {
                  p_card_id: command.cardId,
                  p_quantity: command.quantity,
                  p_request_id: requestId,
                },
              ] as const)
      const receipt = parseReceipt(await rpc(name, args), userId)
      const reference =
        command.kind === 'starter'
          ? command.starterId
          : command.kind === 'pack'
            ? command.packId
            : command.cardId
      if (
        receipt.request_id !== requestId ||
        receipt.kind !== command.kind ||
        receipt.reference !== reference ||
        (command.kind === 'pack' && receipt.currency !== command.currency) ||
        (command.kind === 'fragment' && receipt.quantity !== command.quantity)
      )
        throw new CollectionFailure('invalidData')
      return receipt
    },
  }
}
export function pendingStorage(userId: string): PendingStorage {
  const key = 'lumemon.collection.request.v1.' + userId
  return {
    read() {
      const raw = sessionStorage.getItem(key)
      return raw ? parsePending(JSON.parse(raw)) : null
    },
    write(value) {
      sessionStorage.setItem(key, JSON.stringify(parsePending(value)))
    },
    clear() {
      sessionStorage.removeItem(key)
    },
  }
}
