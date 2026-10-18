import type { PlaybackFrame } from '../battle/playback.ts'
import type { SoundCue } from './controller.ts'
const cries: Record<number, string> = {
  152: '152.ogg',
  155: '155.ogg',
  158: '158.ogg',
  196: '196.ogg',
  197: '197.ogg',
  212: '212.ogg',
  1: '1.ogg',
  3: '3.ogg',
  6: '6.ogg',
  9: '9.ogg',
  94: '94.ogg',
  143: '143.ogg',
  149: '149.ogg',
  4: '4.ogg',
  7: '7.ogg',
  25: '25.mp3',
  37: '37.ogg',
  39: '39.ogg',
  63: '63.ogg',
  66: '66.ogg',
  92: '92.ogg',
  95: '95.ogg',
  131: '131.ogg',
  133: '133.ogg',
}
export function cryPath(speciesId: number): string | undefined {
  return cries[speciesId] ? '/assets/audio/cries/' + cries[speciesId] : undefined
}
export function frameCue(frame: PlaybackFrame): SoundCue | null {
  const event = frame.event,
    type = frame.type
  if (!event) return null
  switch (event.kind) {
    case 'move':
      return { kind: 'attack', type }
    case 'damage':
      return { kind: event.amount > 0 ? 'hit' : 'immune', type }
    case 'status':
      return event.outcome === 'applied'
        ? { kind: 'status', type }
        : event.outcome === 'immune'
          ? { kind: 'immune' }
          : null
    case 'switch':
      return {
        kind: 'switch',
        cryPath: cryPath(
          frame.battle.sides[event.side].fighters.find((f) => f.id === event.to)!.speciesId,
        ),
      }
    case 'faint':
      return { kind: 'faint' }
    case 'result':
      return { kind: event.result.kind === 'win' && event.result.winner === 0 ? 'win' : 'lose' }
    default:
      return null
  }
}
