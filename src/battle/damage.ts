import type { DamageInput, DamageResult } from './types.ts'
import { assertPokemonTypes, getTypeEffectiveness } from './type-chart.ts'

export const DAMAGE_RULESET_VERSION = 'lumemon-damage-v1'

/**
 * Pure damage for a living target. The caller must establish move/actor eligibility.
 * damage is HP actually lost (capped), not theoretical overkill damage.
 * This does not apply status moves, consume buffs, resolve a turn or mutate combatants.
 */
export function calculateDamage(input: DamageInput): DamageResult {
  if (input === null || typeof input !== 'object') throw new TypeError('Expected damage input')
  for (const field of ['power', 'attack', 'defense', 'defenderHp'] as const) {
    if (!Number.isSafeInteger(input[field]) || input[field] <= 0) {
      throw new RangeError(`${field} must be a positive safe integer`)
    }
  }
  for (const field of ['burned', 'boosted', 'shielded'] as const) {
    if (input[field] !== undefined && typeof input[field] !== 'boolean') {
      throw new TypeError(`${field} must be a boolean`)
    }
  }
  assertPokemonTypes(input.attackerTypes)
  const effectiveness = getTypeEffectiveness(input.moveType, input.defenderTypes)
  const sameTypeBonus = input.attackerTypes.includes(input.moveType)

  // Every supported effectiveness is an exact multiple of 1/4.
  let numerator = BigInt(input.power) * BigInt(input.attack) * BigInt(effectiveness * 4)
  let denominator = BigInt(input.defense) * 4n
  if (sameTypeBonus) {
    numerator *= 5n
    denominator *= 4n
  }
  if (input.burned) {
    numerator *= 4n
    denominator *= 5n
  }
  if (input.boosted) {
    numerator *= 3n
    denominator *= 2n
  }
  if (input.shielded) {
    numerator *= 7n
    denominator *= 10n
  }
  let theoreticalDamage = numerator / denominator
  if (effectiveness !== 0 && theoreticalDamage < 1n) theoreticalDamage = 1n
  const hp = BigInt(input.defenderHp)
  const damage = Number(theoreticalDamage > hp ? hp : theoreticalDamage)
  return {
    damage,
    remainingHp: input.defenderHp - damage,
    effectiveness,
    sameTypeBonus,
    rulesetVersion: DAMAGE_RULESET_VERSION,
  }
}
