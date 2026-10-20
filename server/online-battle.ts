import { randomInt } from 'node:crypto'
import { createPractice, practiceReducer, DEFAULT_PLAYER } from '../src/battle/practice.ts'
import type { PracticeSession } from '../src/battle/practice.ts'
import { BattleFailure, sameCommand } from '../src/online-battle/protocol.ts'
import type {
  BattleCommand,
  BattleRequest,
  OnlineView,
  OnlineMatch,
} from '../src/online-battle/protocol.ts'
export interface PrivateContext extends Omit<OnlineView, 'match'> {
  match: (Omit<OnlineMatch, 'session'> & { session: PracticeSession }) | null
}
export interface BattleRepository {
  read(userId: string, requestId?: string): Promise<PrivateContext>
  write(
    userId: string,
    requestId: string,
    command: BattleCommand,
    session: PracticeSession | null,
  ): Promise<PrivateContext>
}
export function publicView(context: PrivateContext): OnlineView {
  const m = context.match
  return {
    user_id: context.user_id,
    version: 'lumemon-online-v1',
    coins: context.coins,
    owned: context.owned,
    receipt: context.receipt,
    match: m
      ? {
          id: m.id,
          revision: m.revision,
          status: m.status,
          reward: m.reward,
          session: {
            battle: m.session.battle,
            opponentId: m.session.opponentId,
            rounds: m.session.rounds,
          },
        }
      : null,
  }
}
const current = createPractice('online-version', DEFAULT_PLAYER, false, 'rookie', [], []).battle
export function createBattleService(
  repo: BattleRepository,
  tieBreak: () => 0 | 1 = () => randomInt(2) as 0 | 1,
) {
  return async (userId: string, request: BattleRequest): Promise<OnlineView> => {
    const context = await repo.read(
      userId,
      request.kind === 'load' ? request.pendingRequestId : request.requestId,
    )
    if (context.user_id !== userId) throw new BattleFailure('identity')
    if (request.kind === 'load') return publicView(context)
    const { command, requestId } = request
    if (context.receipt) {
      if (!sameCommand(context.receipt.command, command))
        throw new BattleFailure('request_conflict')
      return publicView(context)
    }
    let next: PracticeSession | null = null
    if (command.kind === 'start') {
      if (context.match?.status === 'active') throw new BattleFailure('active_battle')
      if (
        !command.cardIds.every((id) =>
          context.owned.some((c) => c.card_id === id && c.quantity > 0),
        )
      )
        throw new BattleFailure('invalid_team')
      try {
        next = createPractice(requestId, command.cardIds, false, 'rookie', [], [])
      } catch {
        throw new BattleFailure('invalid_team')
      }
    } else {
      const match = context.match
      if (
        !match ||
        match.id !== command.battleId ||
        match.revision !== command.expectedRevision ||
        match.status !== 'active'
      )
        throw new BattleFailure('battle_conflict')
      if (command.kind !== 'abandon') {
        const s = match.session,
          b = s.battle
        if (
          b.dataVersion !== current.dataVersion ||
          b.rulesetVersion !== current.rulesetVersion ||
          b.damageRulesetVersion !== current.damageRulesetVersion
        )
          throw new BattleFailure('version_mismatch')
        try {
          const base = { battleId: match.id, expectedVersion: b.version }
          next = practiceReducer(
            s,
            command.kind === 'turn'
              ? { ...base, kind: 'turn', action: command.action, tieBreak: tieBreak() }
              : { ...base, kind: 'replace', targetId: command.targetId },
          )
          if (!next || next === s) throw new Error('unchanged')
        } catch {
          throw new BattleFailure('invalid_action')
        }
      }
    }
    return publicView(await repo.write(userId, requestId, command, next))
  }
}
