import { makePlayableSupports, SUPPORT_DATA_VERSION } from './supports.ts'
import snapshot from './data/starter-roster.json' with { type: 'json' }
import { createBattle, requireValid } from './battle-state.ts'
import type { BattleState } from './engine-types.ts'
import type { BattleRoster, PlayableCard, BattleSpecies } from './data-types.ts'

// Build-time verified, bundled data. Never accept an arbitrary client snapshot here.
const roster = snapshot as unknown as BattleRoster
export function listPlayableCards(): PlayableCard[] {
  return structuredClone(roster.cards)
}
export function getPlayableCard(id: string): PlayableCard | undefined {
  const card = roster.cards.find((c) => c.id === id)
  return card ? structuredClone(card) : undefined
}
export function createPlayableBattle(
  battleId: string,
  teams: readonly [readonly string[], readonly string[]],
  supportIds: readonly [readonly string[], readonly string[]] = [[], []],
): BattleState {
  requireValid(Array.isArray(teams) && teams.length === 2, 'two playable teams')
  requireValid(Array.isArray(supportIds) && supportIds.length === 2, 'two support selections')
  const makeTeam = (ids: readonly string[], selectedSupports: readonly string[]) => {
    requireValid(Array.isArray(ids) && ids.length === 6, 'six playable cards')
    const fighters = Array.from(ids, (id) => {
      const card = getPlayableCard(id)
      requireValid(card, 'card not enabled for battle: ' + id)
      return card
    })
    return { fighters, supports: makePlayableSupports(selectedSupports) }
  }
  return createBattle({
    battleId,
    dataVersion: supportIds.some((ids) => ids.length)
      ? roster.version + ':' + SUPPORT_DATA_VERSION
      : roster.version,
    teams: [makeTeam(teams[0], supportIds[0]), makeTeam(teams[1], supportIds[1])],
  })
}

export function listBattleSpecies(): BattleSpecies[] {
  return structuredClone(roster.species)
}
