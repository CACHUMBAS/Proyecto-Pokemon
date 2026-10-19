import type { PlayerProfile } from './validation.ts'
export type AccountUser = { id: string; email: string }
export interface SessionGateway {
  currentUser(): Promise<AccountUser | null>
  loadProfile(userId: string): Promise<PlayerProfile>
  listen(listener: (event: string, userId: string | null) => void): () => void
}
export type AccountSnapshot = {
  status: 'loading' | 'signedOut' | 'ready' | 'error'
  user: AccountUser | null
  profile: PlayerProfile | null
}
export function createSessionStore(gateway: SessionGateway) {
  let state: AccountSnapshot = { status: 'loading', user: null, profile: null }
  let active = false
  let revision = 0
  const listeners = new Set<() => void>()
  const publish = (next: AccountSnapshot) => {
    state = next
    listeners.forEach((listener) => listener())
  }
  const clear = (status: AccountSnapshot['status']) =>
    publish({ status, user: null, profile: null })
  async function revalidate(preserveReady = false) {
    if (!active) return
    const ticket = ++revision
    if (!preserveReady) clear('loading')
    const current = () => active && ticket === revision
    try {
      const user = await gateway.currentUser()
      if (!current()) return
      if (!user) {
        clear('signedOut')
        return
      }
      if (state.user && state.user.id !== user.id) clear('loading')
      const profile = await gateway.loadProfile(user.id)
      if (!current()) return
      if (profile.id !== user.id) throw new Error('Identity changed')
      publish({ status: 'ready', user, profile })
    } catch {
      if (current()) clear('error')
    }
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    refresh: () => revalidate(),
    start() {
      active = true
      const unsubscribe = gateway.listen((event, userId) => {
        const preserveReady =
          state.status === 'ready' &&
          state.user?.id === userId &&
          ['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)
        ++revision
        if (!preserveReady) clear('loading')
        // Never await SDK calls inside the Auth event callback.
        queueMicrotask(() => {
          if (active)
            void revalidate(preserveReady && state.status === 'ready' && state.user?.id === userId)
        })
      })
      void revalidate()
      return () => {
        active = false
        ++revision
        unsubscribe()
        clear('loading')
      }
    },
  }
}
