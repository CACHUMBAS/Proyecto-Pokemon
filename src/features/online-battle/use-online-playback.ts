import { useEffect, useState, useSyncExternalStore } from 'react'
import { updatePlayback } from '../../online-battle/playback'
import type { OnlineMatch } from '../../online-battle/protocol'
const query = '(prefers-reduced-motion: reduce)'
const subscribe = (notify: () => void) => {
  const media = matchMedia(query)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}
export function useOnlinePlayback(match: OnlineMatch | null) {
  const [view, setView] = useState(() => updatePlayback(null, match))
  const [animations, setAnimations] = useState(true)
  const reducedMotion = useSyncExternalStore(
    subscribe,
    () => matchMedia(query).matches,
    () => false,
  )
  if (view.match !== match) setView(updatePlayback(view, match))
  const frame = view.frames[view.cursor] ?? null
  useEffect(() => {
    if (!frame) return
    const current = view
    const skipHidden = () => {
      if (document.hidden) setView((v) => (v === current ? { ...v, frames: [], cursor: 0 } : v))
    }
    const timer = setTimeout(
      () => setView((v) => (v === current ? { ...v, cursor: v.cursor + 1 } : v)),
      frame.duration,
    )
    document.addEventListener('visibilitychange', skipHidden)
    skipHidden()
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', skipHidden)
    }
  }, [view, frame])
  return {
    view,
    frame,
    playing: !!frame,
    animations: animations && !reducedMotion,
    reducedMotion,
    setAnimations,
    skip: () => setView((v) => ({ ...v, frames: [], cursor: 0 })),
  }
}
