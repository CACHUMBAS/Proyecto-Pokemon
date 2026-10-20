import {
  CollectionFailure,
  type CollectionGateway,
  type PendingStorage,
  type CollectionState,
  type CollectionCommand,
  type CollectionFailureCode,
} from './types.ts'
const empty = (): CollectionState => ({
  status: 'loading',
  data: null,
  busy: false,
  pending: null,
  receipt: null,
  error: null,
})
export function createCollectionStore(
  gateway: CollectionGateway,
  storage: PendingStorage,
  newId: () => string = () => crypto.randomUUID(),
) {
  let state = empty(),
    active = false,
    revision = 0
  const listeners = new Set<() => void>()
  const publish = (patch: Partial<CollectionState>) => {
    state = { ...state, ...patch }
    listeners.forEach((fn) => fn())
  }
  const current = (ticket: number) => active && revision === ticket
  const code = (cause: unknown): CollectionFailureCode =>
    cause instanceof CollectionFailure ? cause.code : 'request'
  async function refresh(error: CollectionFailureCode | null = null) {
    if (!active || state.busy) return
    const ticket = ++revision
    publish({ status: 'loading', data: null, error })
    try {
      const data = await gateway.load()
      if (!current(ticket)) return
      const recovered =
        state.pending && data.events.find((e) => e.request_id === state.pending!.requestId)
      if (recovered) {
        storage.clear()
        publish({ pending: null, receipt: recovered })
      }
      publish({ status: 'ready', data, error: state.pending ? 'uncertain' : error })
    } catch (cause) {
      if (current(ticket)) publish({ status: 'error', data: null, error: code(cause) })
    }
  }
  async function executePending() {
    if (!active || state.busy || !state.pending) return
    const ticket = ++revision,
      pending = state.pending
    let confirmed = false
    publish({ busy: true, error: null })
    try {
      const receipt = await gateway.execute(pending.command, pending.requestId)
      if (!current(ticket)) return
      confirmed = true
      storage.clear()
      publish({ receipt, pending: null, data: null })
      const data = await gateway.load()
      if (current(ticket)) publish({ data, status: 'ready', busy: false })
    } catch (cause) {
      if (!current(ticket)) return
      const failure = code(cause)
      const definitive =
        cause instanceof CollectionFailure &&
        !['request', 'identity', 'invalidData'].includes(failure)
      if (confirmed) {
        publish({ data: null, status: 'error', busy: false, error: failure })
        return
      }
      if (definitive) {
        try {
          storage.clear()
        } catch {
          publish({ busy: false, error: 'storage' })
          return
        }
        publish({ pending: null, busy: false })
        await refresh(failure)
      } else publish({ busy: false, error: 'uncertain' })
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    refresh: () => refresh(),
    async submit(command: CollectionCommand) {
      if (!active || state.busy || state.pending || state.status !== 'ready' || !state.data) return
      const pending = { requestId: newId(), command }
      try {
        storage.write(pending)
      } catch {
        publish({ error: 'storage' })
        return
      }
      publish({ pending })
      await executePending()
    },
    retry: executePending,
    start() {
      active = true
      ++revision
      try {
        publish({ ...empty(), pending: storage.read() })
        void refresh()
      } catch {
        publish({ ...empty(), status: 'error', error: 'storage' })
      }
      return () => {
        active = false
        ++revision
        publish(empty())
      }
    },
  }
}
