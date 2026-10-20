import { BattleFailure, parseRequest } from '../src/online-battle/protocol.ts'
import type { BattleRequest, OnlineView } from '../src/online-battle/protocol.ts'
export interface HandlerDependencies {
  authenticate(token: string): Promise<string | null>
  execute(user: string, request: BattleRequest): Promise<OnlineView>
}
export const MAX_BODY = 8192
export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}
export async function limitedBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) throw new RangeError('body')
  const reader = request.body?.getReader()
  if (!reader) throw new BattleFailure('invalid_request')
  const chunks: Uint8Array[] = []
  let bytes = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.length
      if (bytes > MAX_BODY) {
        await reader.cancel()
        throw new RangeError('body')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const all = new Uint8Array(bytes)
  let offset = 0
  for (const chunk of chunks) {
    all.set(chunk, offset)
    offset += chunk.length
  }
  try {
    return JSON.parse(new TextDecoder().decode(all))
  } catch {
    throw new BattleFailure('invalid_request')
  }
}
export function createHandler(deps: HandlerDependencies | null) {
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return jsonResponse({ error: 'invalid_request' }, 405)
    if (!deps) return jsonResponse({ error: 'unavailable' }, 503)
    try {
      const token = /^Bearer ([^\s]+)$/.exec(request.headers.get('authorization') ?? '')?.[1]
      if (!token) return jsonResponse({ error: 'identity' }, 401)
      const user = await deps.authenticate(token)
      if (!user) return jsonResponse({ error: 'identity' }, 401)
      if (!request.headers.get('content-type')?.startsWith('application/json'))
        throw new BattleFailure('invalid_request')
      const body = parseRequest(await limitedBody(request))
      return jsonResponse(await deps.execute(user, body))
    } catch (error) {
      if (error instanceof RangeError) return jsonResponse({ error: 'invalid_request' }, 413)
      const code = error instanceof BattleFailure ? error.code : 'unavailable'
      const status =
        code === 'identity'
          ? 401
          : code === 'unavailable'
            ? 503
            : ['battle_conflict', 'request_conflict', 'active_battle', 'version_mismatch'].includes(
                  code,
                )
              ? 409
              : 400
      return jsonResponse({ error: code }, status)
    }
  }
}
