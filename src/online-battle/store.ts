import { BattleFailure, parsePending, sameCommand } from './protocol.ts'
import type { BattleCommand, OnlineView, PendingBattle, BattleFailureCode } from './protocol.ts'
import type { OnlineGateway, BattleStorage } from './gateway.ts'
export interface OnlineState {
  status: 'loading' | 'ready' | 'error'
  data: OnlineView | null
  busy: boolean
  pending: PendingBattle | null
  error: BattleFailureCode | null
}
const initial = (): OnlineState => ({
  status: 'loading',
  data: null,
  busy: false,
  pending: null,
  error: null,
})
export function createOnlineStore(
  gateway: OnlineGateway,
  storage: BattleStorage,
  newId: () => string = () => crypto.randomUUID(),
) {
  let state = initial(),
    active = false,
    epoch = 0
  const listeners = new Set<() => void>()
  const emit = (patch: Partial<OnlineState>) => {
    state = { ...state, ...patch }
    listeners.forEach((fn) => fn())
  }
  const alive = (stamp: number) => active && epoch === stamp
  const fail = (e: unknown): BattleFailureCode =>
    e instanceof BattleFailure ? e.code : 'uncertain'
  function clear() {
    try {
      storage.clear()
    } catch {
      throw new BattleFailure('storage')
    }
  }
  function accept(data: OnlineView, required: boolean) {
    if (state.pending) {
      const receipt = data.receipt
      if (
        receipt &&
        receipt.requestId === state.pending.requestId &&
        sameCommand(receipt.command, state.pending.command)
      ) {
        clear()
        emit({ pending: null })
      } else if (required) throw new BattleFailure('invalid_data')
    }
    emit({ data, status: 'ready', error: null })
  }
  async function refresh() {
    if (!active || state.busy) return
    const stamp = epoch
    emit({ busy: true, error: null })
    try {
      const data = await gateway.exchange(
        state.pending
          ? { kind: 'load', pendingRequestId: state.pending.requestId }
          : { kind: 'load' },
      )
      if (alive(stamp)) accept(data, false)
    } catch (e) {
      if (alive(stamp)) emit({ status: state.data ? 'ready' : 'error', error: fail(e) })
    } finally {
      if (alive(stamp)) emit({ busy: false })
    }
  }
  async function retry() {
    if (!active || state.busy || !state.pending) return
    const pending = state.pending,
      stamp = epoch
    emit({ busy: true, error: null })
    try {
      const data = await gateway.exchange({ kind: 'submit', ...pending })
      if (alive(stamp)) accept(data, true)
    } catch (e) {
      if (!alive(stamp)) return
      const code = fail(e)
      if (!['uncertain', 'unavailable', 'identity', 'invalid_data', 'storage'].includes(code)) {
        try {
          clear()
          emit({ pending: null })
          const data = await gateway.exchange({ kind: 'load' })
          if (alive(stamp)) emit({ data, status: 'ready' })
        } catch (problem) {
          if (alive(stamp)) emit({ error: fail(problem) })
        }
      }
      if (alive(stamp)) emit({ error: code })
    } finally {
      if (alive(stamp)) emit({ busy: false })
    }
  }
  return {
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    getSnapshot: () => state,
    start() {
      active = true
      epoch++
      state = initial()
      try {
        state.pending = storage.read()
        void refresh()
      } catch {
        emit({ status: 'error', error: 'storage' })
      }
      return () => {
        active = false
        epoch++
        emit(initial())
      }
    },
    refresh,
    retry,
    async submit(command: BattleCommand) {
      if (
        !active ||
        state.busy ||
        state.pending ||
        state.status !== 'ready' ||
        state.error === 'storage'
      )
        return
      try {
        const pending = parsePending({ requestId: newId(), command })
        try {
          storage.write(pending)
        } catch {
          throw new BattleFailure('storage')
        }
        emit({ pending })
        await retry()
      } catch (e) {
        emit({ error: fail(e) })
      }
    },
  }
}
