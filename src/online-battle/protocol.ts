import type { BattleAction } from '../battle/engine-types.ts'
import type { PracticeSession } from '../battle/practice.ts'
export type BattleCommand =
  | { kind: 'start'; cardIds: string[] }
  | { kind: 'turn'; battleId: string; expectedRevision: number; action: BattleAction }
  | { kind: 'replace'; battleId: string; expectedRevision: number; targetId: string }
  | { kind: 'abandon'; battleId: string; expectedRevision: number }
export interface PendingBattle {
  requestId: string
  command: BattleCommand
}
export type BattleRequest =
  { kind: 'load'; pendingRequestId?: string } | ({ kind: 'submit' } & PendingBattle)
export type PublicSession = Pick<PracticeSession, 'battle' | 'opponentId' | 'rounds'>
export interface OnlineMatch {
  id: string
  revision: number
  status: 'active' | 'finished' | 'abandoned'
  reward: number
  session: PublicSession
}
export interface OnlineView {
  user_id: string
  version: 'lumemon-online-v1'
  coins: number
  owned: { card_id: string; quantity: number }[]
  match: OnlineMatch | null
  receipt: PendingBattle | null
}
export const failureCodes = [
  'invalid_request',
  'invalid_team',
  'invalid_action',
  'starter_required',
  'active_battle',
  'battle_conflict',
  'request_conflict',
  'version_mismatch',
  'balance_limit',
  'identity',
  'unavailable',
  'uncertain',
  'storage',
  'invalid_data',
] as const
export type BattleFailureCode = (typeof failureCodes)[number]
export class BattleFailure extends Error {
  code: BattleFailureCode
  constructor(code: BattleFailureCode) {
    super(code)
    this.code = code
  }
}
export function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
export const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v)
export const integer = (v: unknown): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= 0
const identifier = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/.test(v) &&
  !Object.hasOwn(Object.prototype, v)
function requireInput(condition: unknown): asserts condition {
  if (!condition) throw new BattleFailure('invalid_request')
}
function keys(v: Record<string, unknown>, expected: string[]) {
  requireInput(
    Object.keys(v).length === expected.length && expected.every((k) => Object.hasOwn(v, k)),
  )
}
function action(v: unknown): BattleAction {
  requireInput(object(v))
  if (v.kind === 'pass') {
    keys(v, ['kind'])
    return { kind: 'pass' }
  }
  if (v.kind === 'move') {
    keys(v, ['kind', 'actorId', 'moveId'])
    requireInput(identifier(v.actorId) && identifier(v.moveId))
    return { kind: 'move', actorId: v.actorId, moveId: v.moveId }
  }
  requireInput(v.kind === 'switch')
  keys(v, ['kind', 'actorId', 'targetId'])
  requireInput(identifier(v.actorId) && identifier(v.targetId))
  return { kind: 'switch', actorId: v.actorId, targetId: v.targetId }
}
export function parseCommand(v: unknown): BattleCommand {
  requireInput(object(v))
  if (v.kind === 'start') {
    keys(v, ['kind', 'cardIds'])
    requireInput(
      Array.isArray(v.cardIds) &&
        v.cardIds.length === 6 &&
        v.cardIds.every(identifier) &&
        new Set(v.cardIds).size === 6,
    )
    return { kind: 'start', cardIds: [...v.cardIds] }
  }
  requireInput(uuid(v.battleId) && integer(v.expectedRevision) && v.expectedRevision <= 1000)
  if (v.kind === 'turn') {
    keys(v, ['kind', 'battleId', 'expectedRevision', 'action'])
    return {
      kind: 'turn',
      battleId: v.battleId,
      expectedRevision: v.expectedRevision,
      action: action(v.action),
    }
  }
  if (v.kind === 'replace') {
    keys(v, ['kind', 'battleId', 'expectedRevision', 'targetId'])
    requireInput(identifier(v.targetId))
    return {
      kind: 'replace',
      battleId: v.battleId,
      expectedRevision: v.expectedRevision,
      targetId: v.targetId,
    }
  }
  requireInput(v.kind === 'abandon')
  keys(v, ['kind', 'battleId', 'expectedRevision'])
  return { kind: 'abandon', battleId: v.battleId, expectedRevision: v.expectedRevision }
}
export function parsePending(v: unknown): PendingBattle {
  requireInput(object(v))
  keys(v, ['requestId', 'command'])
  requireInput(uuid(v.requestId))
  return { requestId: v.requestId, command: parseCommand(v.command) }
}
export function parseRequest(v: unknown): BattleRequest {
  requireInput(object(v))
  if (v.kind === 'load') {
    keys(v, Object.hasOwn(v, 'pendingRequestId') ? ['kind', 'pendingRequestId'] : ['kind'])
    requireInput(v.pendingRequestId === undefined || uuid(v.pendingRequestId))
    return v.pendingRequestId
      ? { kind: 'load', pendingRequestId: v.pendingRequestId }
      : { kind: 'load' }
  }
  requireInput(v.kind === 'submit')
  keys(v, ['kind', 'requestId', 'command'])
  return { kind: 'submit', ...parsePending({ requestId: v.requestId, command: v.command }) }
}
export function sameCommand(a: BattleCommand, b: BattleCommand) {
  return JSON.stringify(parseCommand(a)) === JSON.stringify(parseCommand(b))
}
