import { useEffect, useReducer, useState, useSyncExternalStore } from 'react'
import { createPresentation, presentationReducer } from '../../battle/playback'
const query = '(prefers-reduced-motion: reduce)'
const subscribe = (notify: () => void) => {
  const media = matchMedia(query)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
const snapshot = () => matchMedia(query).matches
export function useBattlePlayback() {
  const [presentation, dispatch] = useReducer(presentationReducer, undefined, createPresentation)
  const [animations, setAnimations] = useState(true)
  const reducedMotion = useSyncExternalStore(subscribe, snapshot, () => false)
  const frame = presentation.frames[presentation.cursor] ?? null
  const battleId = presentation.session?.battle.battleId
  const version = presentation.session?.battle.version
  const cursor = presentation.cursor
  useEffect(() => {
    if (!frame || !battleId || version === undefined) return
    const token = { battleId, expectedVersion: version, cursor }
    const skip = () => {
      if (document.hidden) dispatch({ kind: 'skip', ...token })
    }
    const timer = window.setTimeout(
      () => dispatch({ kind: reducedMotion || !animations ? 'skip' : 'tick', ...token }),
      reducedMotion || !animations ? 0 : frame.duration,
    )
    skip()
    document.addEventListener('visibilitychange', skip)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', skip)
    }
  }, [frame, battleId, version, cursor, reducedMotion, animations])
  function skip() {
    if (battleId && version !== undefined)
      dispatch({ kind: 'skip', battleId, expectedVersion: version, cursor })
  }
  return {
    presentation,
    dispatch,
    frame,
    playing: !!frame,
    skip,
    animations: animations && !reducedMotion,
    setAnimations,
    reducedMotion,
  }
}
