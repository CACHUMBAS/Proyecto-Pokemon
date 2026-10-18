import { requireValid } from './battle-state.ts'

export type PracticeOpponentId = 'rookie' | 'balanced' | 'elite'
export interface PracticeOpponent {
  id: PracticeOpponentId
  cardIds: string[]
  supportIds: string[]
}
export const DEFAULT_OPPONENT: PracticeOpponentId = 'balanced'
export const DEFAULT_BOT = [
  'base1-43',
  'base1-52',
  'base1-50',
  'base1-56',
  'sv03.5-131',
  'base2-51',
] as const

// Difficulty uses existing card profiles plus tactical switches for Elite; no stat multipliers.
// Keep the balanced team stable: the guided tutorial relies on its order.
const opponents: readonly PracticeOpponent[] = [
  {
    id: 'rookie',
    supportIds: ['base1-90'],
    cardIds: ['base2-51', 'base1-44', 'base1-46', 'base1-63', 'base1-58', 'base1-68'],
  },
  { id: 'balanced', cardIds: [...DEFAULT_BOT], supportIds: ['base1-90', 'base1-82'] },
  {
    id: 'elite',
    supportIds: ['base1-90', 'base1-80', 'base1-96'],
    cardIds: ['sv03.5-199', 'sv03.5-198', 'sv03.5-200', 'base3-5', 'base2-11', 'base3-4'],
  },
]

export function listPracticeOpponents(): PracticeOpponent[] {
  return structuredClone([...opponents])
}
export function getPracticeOpponent(id: string): PracticeOpponent {
  const opponent = opponents.find((o) => o.id === id)
  requireValid(opponent, 'unknown practice opponent: ' + id)
  return structuredClone(opponent)
}
