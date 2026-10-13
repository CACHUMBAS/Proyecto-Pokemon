import type { PlaybackFrame } from '../../battle/playback'
export function fighterMotion(frame: PlaybackFrame | null, side: 0 | 1): string {
  const event = frame?.event
  if (!event || !('side' in event) || event.side !== side) return ''
  if (event.kind === 'move') return ' is-attacking'
  if (event.kind === 'damage' && event.amount > 0) return ' is-hit'
  if (event.kind === 'switch') return ' is-entering'
  if (event.kind === 'status' && event.outcome === 'applied') return ' is-afflicted'
  return ''
}
