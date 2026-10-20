import { buildPlaybackFrames } from '../battle/playback.ts'
import type { PlaybackFrame } from '../battle/playback.ts'
import type { OnlineMatch, PublicSession } from './protocol.ts'
export interface OnlinePlayback {
  match: OnlineMatch | null
  frames: PlaybackFrame[]
  cursor: number
  previousRounds: PublicSession['rounds']
}
export function updatePlayback(
  previous: OnlinePlayback | null,
  match: OnlineMatch | null,
): OnlinePlayback {
  if (previous && previous.match?.id === match?.id && previous?.match?.revision === match?.revision)
    return { ...previous!, match }
  const canAnimate =
    previous?.match &&
    match &&
    previous.match.id === match.id &&
    match.revision === previous.match.revision + 1 &&
    match.status !== 'abandoned'
  if (!canAnimate) return { match, frames: [], cursor: 0, previousRounds: [] }
  const count = previous.match!.session.rounds.flatMap((r) => r.events).length
  const events = match.session.rounds.flatMap((r) => r.events).slice(count)
  return {
    match,
    frames: buildPlaybackFrames(previous.match!.session.battle, match.session.battle, events),
    cursor: 0,
    previousRounds: previous.match!.session.rounds,
  }
}
