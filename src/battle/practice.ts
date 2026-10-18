import { chooseBotAction, chooseTacticalBotAction } from './bot.ts'
export { chooseBotAction } from './bot.ts'
import { DEFAULT_OPPONENT, getPracticeOpponent } from './opponents.ts'
import type { PracticeOpponentId } from './opponents.ts'
export { DEFAULT_BOT } from './opponents.ts'
import { TUTORIAL_PLAYER, tutorialAction, advanceTutorial, matchesAction } from './tutorial.ts'
import type { TutorialStep } from './tutorial.ts'
import { activeFighter, requireValid } from './battle-state.ts'
import { createPlayableBattle } from './playable-roster.ts'
import { resolveReplacements, resolveTurn } from './turn-engine.ts'
import type { BattleAction, BattleEvent, BattleState, BattleTransition } from './engine-types.ts'

export interface PracticeSession {
  battle: BattleState
  opponentId: PracticeOpponentId
  tutorial: TutorialStep | null
  botAction: BattleAction | null
  rounds: { turn: number; events: BattleEvent[] }[]
}
export type PracticeCommand =
  | {
      kind: 'start'
      battleId: string
      playerIds: readonly string[]
      tutorial?: boolean
      opponentId?: PracticeOpponentId
    }
  | {
      kind: 'guide'
      battleId: string
      expectedVersion: number
      expectedStep: TutorialStep
      action: 'next' | 'dismiss'
    }
  | {
      kind: 'turn'
      battleId: string
      expectedVersion: number
      action: BattleAction
      tieBreak: 0 | 1
    }
  | { kind: 'replace'; battleId: string; expectedVersion: number; targetId: string }
  | { kind: 'exit'; battleId: string; expectedVersion: number }

export const DEFAULT_PLAYER = [
  'base1-44',
  'base1-46',
  'base1-63',
  'base1-58',
  'base1-68',
  'base2-54',
] as const

export function createPractice(
  battleId: string,
  playerIds: readonly string[] = DEFAULT_PLAYER,
  tutorial = false,
  opponentId: string = DEFAULT_OPPONENT,
): PracticeSession {
  const opponent = getPracticeOpponent(tutorial ? DEFAULT_OPPONENT : opponentId)
  const battle = createPlayableBattle(battleId, [
    tutorial ? TUTORIAL_PLAYER : playerIds,
    opponent.cardIds,
  ])
  return {
    battle,
    opponentId: opponent.id,
    botAction: opponent.id === 'elite' ? chooseTacticalBotAction(battle) : chooseBotAction(battle),
    rounds: [],
    tutorial: tutorial ? 'welcome' : null,
  }
}

function advance(session: PracticeSession, transition: BattleTransition): PracticeSession {
  let { state: battle, events } = transition
  if (battle.phase === 'replacement' && activeFighter(battle, 0).hp > 0) {
    const replacement = resolveReplacements(battle, [null, null], battle.version)
    battle = replacement.state
    events = [...events, ...replacement.events]
  }
  const rounds = [...session.rounds]
  const turn = session.battle.turn
  const last = rounds.at(-1)
  if (last?.turn === turn) rounds[rounds.length - 1] = { turn, events: [...last.events, ...events] }
  else rounds.push({ turn, events })
  const lastSwitchTurn = rounds.reduce<number | null>(
    (last, round) =>
      round.events.some((event) => event.kind === 'switch' && event.side === 1) ? round.turn : last,
    null,
  )
  return {
    battle,
    opponentId: session.opponentId,
    rounds,
    tutorial: advanceTutorial(session.tutorial, session.battle, events),
    botAction:
      battle.phase === 'selection'
        ? session.opponentId === 'elite'
          ? chooseTacticalBotAction(battle, lastSwitchTurn)
          : chooseBotAction(battle)
        : null,
  }
}

/** Local commands are versioned and scoped to a match, including across rematches. */
export function practiceReducer(
  session: PracticeSession | null,
  command: PracticeCommand,
): PracticeSession | null {
  if (command.kind === 'start')
    return createPractice(command.battleId, command.playerIds, command.tutorial, command.opponentId)
  if (
    !session ||
    command.battleId !== session.battle.battleId ||
    command.expectedVersion !== session.battle.version
  )
    return session
  if (command.kind === 'exit') return null
  if (command.kind === 'guide') {
    if (!session.tutorial || command.expectedStep !== session.tutorial) return session
    if (command.action === 'dismiss') return { ...session, tutorial: null }
    if (session.tutorial === 'welcome') return { ...session, tutorial: 'attack' }
    if (session.tutorial === 'types') return { ...session, tutorial: 'switch' }
    return session
  }
  if (
    session.tutorial &&
    command.kind === 'turn' &&
    !matchesAction(tutorialAction(session.battle, session.tutorial), command.action)
  )
    return session
  if (command.kind === 'replace') {
    requireValid(activeFighter(session.battle, 0).hp === 0, 'player replacement')
    return advance(
      session,
      resolveReplacements(session.battle, [command.targetId, null], command.expectedVersion),
    )
  }
  requireValid(session.botAction !== null, 'pending bot action')
  return advance(
    session,
    resolveTurn(
      session.battle,
      [command.action, session.botAction],
      command.expectedVersion,
      command.tieBreak,
    ),
  )
}
