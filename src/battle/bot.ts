import { supportUnavailable } from './supports.ts'
import { activeFighter, requireValid } from './battle-state.ts'
import { resolveTurn } from './turn-engine.ts'
import type { BattleAction, BattleState } from './engine-types.ts'

/** Simple, deterministic opponent. It sees the board, never the player's pending choice. */
function bestMove(state: BattleState): { action: BattleAction; score: number } {
  requireValid(state.phase === 'selection', 'bot selection phase')
  const actor = activeFighter(state, 1)
  let best: BattleAction = { kind: 'pass' }
  let bestScore = -1
  for (const move of actor.moves) {
    if ((actor.readyOn[move.id] ?? 1) > state.turn) continue
    const action: BattleAction = { kind: 'move', actorId: actor.id, moveId: move.id }
    // Reuse the engine for immunities, statuses and modifiers; no parallel damage rules.
    const { events } = resolveTurn(state, [{ kind: 'pass' }, action], state.version, 0)
    const score = events.reduce((total, event) => {
      if (event.kind === 'damage' && event.side === 0 && event.source === 'move')
        return total + event.amount
      if (event.kind === 'status' && event.side === 0 && event.outcome === 'applied')
        return total + 45
      return total
    }, 0)
    if (score > bestScore) {
      best = action
      bestScore = score
    }
  }
  return { action: best, score: bestScore }
}

/** Original movement policy, with optional mapped supports; unchanged without a kit. */
export function chooseBotAction(state: BattleState): BattleAction {
  return withSupport(state, bestMove(state).action)
}

/** Worst HP loss against available moves, not a prediction of the player's choice.
 * Include pass, residual damage and both speed-tie outcomes; never mutate the board.
 * Player switches and supports are outside this small heuristic's search horizon.
 */
function exposure(state: BattleState, action: BattleAction) {
  const player = activeFighter(state, 0)
  const incoming =
    action.kind === 'switch'
      ? state.sides[1].fighters.find((f) => f.id === action.targetId)!
      : activeFighter(state, 1)
  const possibilities: BattleAction[] = [
    { kind: 'pass' },
    ...player.moves
      .filter((m) => player.readyOn[m.id] <= state.turn)
      .map((m) => ({
        kind: 'move' as const,
        actorId: player.id,
        moveId: m.id,
      })),
  ]
  let remaining = incoming.maxHp
  let safeKnockout = true
  for (const choice of possibilities) {
    for (const tieBreak of [0, 1] as const) {
      const next = resolveTurn(state, [choice, action], state.version, tieBreak).state
      const survivor = activeFighter(next, 1)
      remaining = Math.min(remaining, survivor.hp)
      safeKnockout &&= survivor.hp > 0 && activeFighter(next, 0).hp === 0
    }
  }
  return {
    risk: Math.max(0, (incoming.hp - remaining) / incoming.hp),
    remainingHp: remaining,
    safeKnockout,
  }
}

/** A conservative one-turn heuristic: protect a threatened active or escape a
 * zero-value matchup. No lookahead at pending input, random rolls or stat buffs.
 * Heuristic thresholds are policy choices, not changes to the combat rules.
 */
function tacticalMovement(state: BattleState, lastSwitchTurn: number | null = null): BattleAction {
  const fallback = bestMove(state)
  // Give the incoming fighter two turns to act; also applies after a forced entry.
  if (state.turn === 60 || (lastSwitchTurn !== null && state.turn - lastSwitchTurn <= 2))
    return fallback.action
  const current = exposure(state, fallback.action)
  if (current.safeKnockout) return fallback.action
  const helpless = fallback.score <= 0
  if (current.risk < 0.5 && !helpless) return fallback.action

  const actor = activeFighter(state, 1)
  let best = fallback.action
  let bestScore = -Infinity
  for (const reserve of state.sides[1].fighters) {
    if (reserve.id === actor.id || reserve.hp === 0) continue
    const action: BattleAction = { kind: 'switch', actorId: actor.id, targetId: reserve.id }
    const entry = exposure(state, action)
    if (entry.risk >= 1) continue
    // A retreat must save at least 25 percentage points of the incoming HP risk.
    // When unable to affect the target, accept a productive entry below 50% risk.
    if (helpless ? entry.risk >= 0.5 : entry.risk > current.risk - 0.25) continue
    const future = resolveTurn(state, [{ kind: 'pass' }, action], state.version, 0).state
    if (future.phase !== 'selection') continue
    const response = bestMove(future)
    if (response.score <= 0) continue
    // Potential next action under an idle opponent; entry danger remains conservative.
    const score = response.score / activeFighter(future, 0).maxHp - entry.risk
    if (score > bestScore) {
      best = action
      bestScore = score
    }
  }
  return best
}

/** Support policy uses the same public board and real resolver, never pending input.
 * Priority: preserve retreat/safe KO, recovery, cleanse, barrier, then boost.
 * Evaluates player moves/pass only; this is a short heuristic, not optimal play. */
function withSupport(state: BattleState, fallback: BattleAction): BattleAction {
  const kit = state.sides[1].supports
  if (!kit.some((s) => !s.used) || fallback.kind === 'switch' || state.turn === 60) return fallback
  const current = exposure(state, fallback)
  if (current.safeKnockout) return fallback
  const actor = activeFighter(state, 1)
  for (const effect of ['heal', 'cleanse', 'barrier', 'boost'] as const) {
    const support = kit.find(
      (s) => s.effect === effect && supportUnavailable(state, 1, s.id) === null,
    )
    if (!support) continue
    if (effect === 'heal' && actor.hp > actor.maxHp / 2) continue
    if (
      effect === 'boost' &&
      (state.turn > 58 || actor.status === 'sleep' || actor.status === 'freeze')
    )
      continue
    const action: BattleAction = { kind: 'support', actorId: actor.id, supportId: support.id }
    const protectedState = exposure(state, action)
    // Do not spend a limited card if any available attack still knocks the active out.
    if (protectedState.remainingHp <= 0) continue
    if (effect === 'heal' && protectedState.remainingHp > current.remainingHp) return action
    if (effect === 'cleanse') return action
    if (
      effect === 'barrier' &&
      current.risk >= 0.25 &&
      protectedState.remainingHp - current.remainingHp >= actor.maxHp * 0.1
    )
      return action
    if (effect === 'boost' && protectedState.remainingHp >= actor.maxHp / 4) {
      const future = resolveTurn(state, [{ kind: 'pass' }, action], state.version, 0).state
      if (future.phase !== 'selection') continue
      const boosted = activeFighter(future, 1)
      const canDamage = boosted.moves.some((move) => {
        if (move.kind !== 'damage' || boosted.readyOn[move.id] > future.turn) return false
        const result = resolveTurn(
          future,
          [{ kind: 'pass' }, { kind: 'move', actorId: boosted.id, moveId: move.id }],
          future.version,
          0,
        )
        return result.events.some(
          (e) => e.kind === 'damage' && e.side === 0 && e.source === 'move' && e.amount > 0,
        )
      })
      if (canDamage) return action
    }
  }
  return fallback
}

export function chooseTacticalBotAction(
  state: BattleState,
  lastSwitchTurn: number | null = null,
): BattleAction {
  return withSupport(state, tacticalMovement(state, lastSwitchTurn))
}
