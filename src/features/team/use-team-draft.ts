import { useEffect, useState } from 'react'
import type { CardRecord } from '../../catalog/types'
import { catalogRepository } from '../../catalog/client'
import {
  TEAM_DRAFT_KEY,
  InvalidTeamDraftError,
  readTeamDraft,
  restoreTeamDraft,
  saveTeamDraft,
  type TeamDraft,
} from '../../battle/team-draft'

const storage = () => window.localStorage
type State = {
  attempt: number
  status: 'ready' | 'invalid' | 'error'
  cards: CardRecord[]
  saved: boolean
  source?: TeamDraft
}
export function useTeamDraft() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<State>({
    attempt: -1,
    status: 'ready',
    cards: [],
    saved: true,
  })
  useEffect(() => {
    function changed(event: StorageEvent) {
      if (event.key === TEAM_DRAFT_KEY || event.key === null) setAttempt((value) => value + 1)
    }
    window.addEventListener('storage', changed)
    return () => window.removeEventListener('storage', changed)
  }, [])
  useEffect(() => {
    let active = true
    const read = readTeamDraft(storage)
    async function restore() {
      if (read.kind === 'invalid') {
        if (active) setState({ attempt, status: 'invalid', cards: [], saved: false })
        return
      }
      try {
        const cards = await restoreTeamDraft(
          read.kind === 'ready' ? read.draft : { version: 1, members: [] },
          catalogRepository,
        )
        if (active)
          setState({
            attempt,
            status: 'ready',
            cards,
            saved: read.kind === 'ready',
            source: read.kind === 'ready' ? read.draft : undefined,
          })
      } catch (error) {
        if (active)
          setState({
            attempt,
            status: error instanceof InvalidTeamDraftError ? 'invalid' : 'error',
            cards: [],
            saved: false,
          })
      }
    }
    void restore()
    return () => {
      active = false
    }
  }, [attempt])
  function commit(cards: CardRecord[]) {
    const result = saveTeamDraft(cards, storage, state.source)
    if (result === 'conflict') {
      setAttempt((value) => value + 1)
      return false
    }
    const saved = result === 'saved'
    const source = saved
      ? {
          version: 1 as const,
          members: cards.map((card) => ({ cardId: card.id, speciesId: card.speciesIds[0] })),
        }
      : state.source
    setState({ attempt, status: 'ready', cards, saved, source })
    return true
  }
  return {
    ...state,
    status: state.attempt === attempt ? state.status : ('loading' as const),
    commit,
    retry: () => setAttempt((value) => value + 1),
  }
}
