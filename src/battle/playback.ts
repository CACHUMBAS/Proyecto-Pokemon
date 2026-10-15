import { practiceReducer } from './practice.ts'
import type { PracticeCommand, PracticeSession } from './practice.ts'
import type { BattleEvent, BattleState } from './engine-types.ts'
import type { PokemonType } from './types.ts'
export interface PlaybackFrame {
  battle: BattleState
  event: BattleEvent | null
  type?: PokemonType
  duration: number
}
export interface Presentation {
  session: PracticeSession | null
  frames: PlaybackFrame[]
  cursor: number
  previousRounds: PracticeSession['rounds']
}
export type PresentationCommand =
  | PracticeCommand
  | { kind: 'tick'; battleId: string; expectedVersion: number; cursor: number }
  | { kind: 'skip'; battleId: string; expectedVersion: number; cursor: number }
export function createPresentation(): Presentation {
  return { session: null, frames: [], cursor: 0, previousRounds: [] }
}

/** Display snapshots only: never feed these intermediate states back into the engine. */
export function buildPlaybackFrames(
  before: BattleState,
  after: BattleState,
  events: readonly BattleEvent[],
): PlaybackFrame[] {
  const view = structuredClone(before),
    frames: PlaybackFrame[] = []
  let type: PokemonType | undefined
  for (const event of events) {
    if (event.kind === 'order') continue
    if (event.kind === 'move') {
      const actor = view.sides[event.side].fighters.find((f) => f.id === event.actorId)!
      type = actor.moves.find((m) => m.id === event.moveId)!.type
      actor.readyOn[event.moveId] = event.readyOn
    } else if (event.kind === 'switch') {
      view.sides[event.side].active = view.sides[event.side].fighters.findIndex(
        (f) => f.id === event.to,
      )
    } else if (event.kind === 'damage') {
      view.sides[event.side].fighters.find((f) => f.id === event.targetId)!.hp = event.remainingHp
      if (event.source !== 'move') type = event.source === 'poison' ? 'poison' : 'fire'
    } else if (event.kind === 'status') {
      const target = view.sides[event.side].fighters.find((f) => f.id === event.targetId)!
      if (event.outcome === 'applied') target.status = event.status
      if (event.outcome === 'cleared') target.status = null
    } else if (event.kind === 'faint') {
      view.sides[event.side].fighters.find((f) => f.id === event.targetId)!.hp = 0
    } else if (event.kind === 'support') {
      const target = view.sides[event.side].fighters.find((f) => f.id === event.actorId)!
      target.hp = Math.min(target.maxHp, target.hp + event.healed)
    }
    frames.push({
      battle: structuredClone(view),
      event: structuredClone(event),
      type,
      duration:
        event.kind === 'move'
          ? 480
          : event.kind === 'damage'
            ? 380
            : event.kind === 'switch'
              ? 500
              : 360,
    })
  }
  frames.push({ battle: structuredClone(after), event: null, duration: 40 })
  return frames
}
export function presentationReducer(
  state: Presentation,
  command: PresentationCommand,
): Presentation {
  if (command.kind === 'tick' || command.kind === 'skip') {
    if (
      !state.session ||
      !state.frames.length ||
      command.battleId !== state.session.battle.battleId ||
      command.expectedVersion !== state.session.battle.version ||
      command.cursor !== state.cursor
    )
      return state
    if (command.kind === 'skip' || state.cursor === state.frames.length - 1)
      return { ...state, frames: [], cursor: 0, previousRounds: [] }
    return { ...state, cursor: state.cursor + 1 }
  }
  if (state.frames.length && command.kind !== 'start' && command.kind !== 'exit') return state
  const next = practiceReducer(state.session, command)
  if (next === state.session) return state
  if (command.kind === 'guide') return { ...state, session: next }
  if (!next || command.kind === 'start') return { ...createPresentation(), session: next }
  const previous = state.session!
  const count = previous.rounds.reduce((sum, r) => sum + r.events.length, 0)
  const events = next.rounds.flatMap((r) => r.events).slice(count)
  return {
    session: next,
    frames: buildPlaybackFrames(previous.battle, next.battle, events),
    cursor: 0,
    previousRounds: previous.rounds,
  }
}
