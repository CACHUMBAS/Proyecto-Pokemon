import type { PracticeSession } from './practice.ts'

export interface SideSummary {
  attackDamage: number
  statusDamageTaken: number
  healed: number
  supportsUsed: number
  fainted: number
}
export interface BattleSummary {
  turns: number
  sides: [SideSummary, SideSummary]
}
/** Reads only the completed match's event history; no rewards or persistence. */
export function summarizeBattle(
  session: Pick<PracticeSession, 'battle' | 'rounds'>,
): BattleSummary | null {
  if (session.battle.phase !== 'finished' || !session.battle.result) return null
  const createSide = (): SideSummary => ({
    attackDamage: 0,
    statusDamageTaken: 0,
    healed: 0,
    supportsUsed: 0,
    fainted: 0,
  })
  const sides: BattleSummary['sides'] = [createSide(), createSide()]
  const turns = new Set<number>()
  for (const round of session.rounds) {
    for (const event of round.events) {
      if (event.kind === 'order') turns.add(round.turn)
      // Damage events identify the recipient, whereas support events identify the user.
      else if (event.kind === 'damage') {
        if (event.source === 'move') sides[event.side === 0 ? 1 : 0].attackDamage += event.amount
        else sides[event.side].statusDamageTaken += event.amount
      } else if (event.kind === 'support') {
        sides[event.side].supportsUsed += 1
        sides[event.side].healed += event.healed
      } else if (event.kind === 'faint') sides[event.side].fainted += 1
    }
  }
  return { turns: turns.size, sides }
}
