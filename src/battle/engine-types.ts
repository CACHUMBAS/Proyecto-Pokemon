import type { PokemonType } from './types.ts'

export const BATTLE_RULESET_VERSION = 'lumemon-turns-v1'
export type Side = 0 | 1
export type Status = 'poison' | 'burn' | 'paralysis' | 'sleep' | 'freeze'
export type SupportEffect = 'heal' | 'cleanse' | 'barrier' | 'boost'
export type BattleMove =
  | {
      readonly id: string
      readonly type: PokemonType
      readonly kind: 'damage'
      readonly power: 40 | 60
      readonly cooldown: 0 | 1
    }
  | {
      readonly id: string
      readonly type: PokemonType
      readonly kind: 'status'
      readonly power: 0
      readonly cooldown: 2
      readonly status: Status
    }
export interface FighterDefinition {
  readonly id: string
  readonly speciesId: number
  readonly types: readonly PokemonType[]
  readonly maxHp: number
  readonly attack: number
  readonly defense: number
  readonly speed: number
  readonly moves: readonly BattleMove[]
}
export interface SupportDefinition {
  readonly id: string
  readonly effect: SupportEffect
}
export interface TeamDefinition {
  readonly fighters: readonly FighterDefinition[]
  readonly supports: readonly SupportDefinition[]
}
export interface BattleSetup {
  readonly battleId: string
  readonly dataVersion: string
  readonly teams: readonly [TeamDefinition, TeamDefinition]
}
export interface Fighter extends FighterDefinition {
  hp: number
  status: Status | null
  readyOn: Record<string, number>
  barrierUntil: number | null
  boost: { charges: number; expiresAfter: number } | null
}
export interface BattleSide {
  fighters: Fighter[]
  active: number
  supports: (SupportDefinition & { used: boolean })[]
}
export type BattleResult =
  | { kind: 'win'; winner: Side; reason: 'knockout' }
  | { kind: 'draw'; reason: 'double-knockout' | 'turn-limit' }
export interface BattleState {
  battleId: string
  dataVersion: string
  rulesetVersion: typeof BATTLE_RULESET_VERSION
  damageRulesetVersion: 'lumemon-damage-v1'
  version: number
  turn: number
  phase: 'selection' | 'replacement' | 'finished'
  sides: [BattleSide, BattleSide]
  result: BattleResult | null
}
export type BattleAction =
  | { readonly kind: 'pass' }
  | { readonly kind: 'move'; readonly actorId: string; readonly moveId: string }
  | { readonly kind: 'switch'; readonly actorId: string; readonly targetId: string }
  | { readonly kind: 'support'; readonly actorId: string; readonly supportId: string }
export type BattleEvent =
  | { kind: 'switch'; side: Side; from: string; to: string; forced: boolean }
  | {
      kind: 'support'
      side: Side
      actorId: string
      supportId: string
      effect: SupportEffect
      healed: number
    }
  | { kind: 'order'; sides: Side[]; tieBreak: Side | null }
  | { kind: 'move'; side: Side; actorId: string; moveId: string; readyOn: number }
  | {
      kind: 'blocked'
      side: Side
      actorId: string
      reason: 'sleep' | 'freeze' | 'knockout' | 'target-knockout'
    }
  | {
      kind: 'damage'
      side: Side
      targetId: string
      source: 'move' | 'poison' | 'burn'
      amount: number
      remainingHp: number
    }
  | {
      kind: 'status'
      side: Side
      targetId: string
      status: Status
      outcome: 'applied' | 'immune' | 'occupied' | 'cleared'
    }
  | { kind: 'faint'; side: Side; targetId: string }
  | { kind: 'expired'; side: Side; targetId: string; effect: 'barrier' | 'boost' }
  | { kind: 'result'; result: BattleResult }
export interface BattleTransition {
  state: BattleState
  events: BattleEvent[]
}
