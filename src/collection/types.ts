export type Payment = 'welcome' | 'coins' | 'fragments'
export type CollectionCommand =
  | { kind: 'starter'; starterId: string }
  | { kind: 'pack'; packId: string; currency: Payment }
  | { kind: 'fragment'; cardId: string; quantity: number }
export interface CollectionCard {
  card_id: string
  species_id: number
  budget: number
  fragment_value: number
}
export interface CollectionReceipt {
  user_id: string
  request_id: string
  kind: CollectionCommand['kind']
  reference: string
  currency: Payment | null
  card_ids: string[]
  quantity: number
  coins_delta: number
  fragments_delta: number
  created_at: string
}
export interface CollectionSnapshot {
  user_id: string
  version: 'lumemon-economy-v1'
  wallet: {
    coins: number
    fragments: number
    starter_id: string | null
    welcome_available: boolean
    revision: number
  }
  inventory: { card_id: string; quantity: number }[]
  cards: CollectionCard[]
  starters: { id: string; card_ids: string[] }[]
  pack: {
    id: string
    coins: number
    fragments: number
    size: number
    odds: { budget: number; weight: number; card_count: number }[]
  }
  events: CollectionReceipt[]
}
export interface PendingOperation {
  requestId: string
  command: CollectionCommand
}
export interface CollectionGateway {
  load(): Promise<CollectionSnapshot>
  execute(command: CollectionCommand, requestId: string): Promise<CollectionReceipt>
}
export interface PendingStorage {
  read(): PendingOperation | null
  write(value: PendingOperation): void
  clear(): void
}
export type CollectionFailureCode =
  | 'request'
  | 'unavailable'
  | 'identity'
  | 'invalidData'
  | 'storage'
  | 'uncertain'
  | 'insufficient_balance'
  | 'starter_claimed'
  | 'starter_required'
  | 'welcome_used'
  | 'last_copy'
  | 'request_conflict'
export class CollectionFailure extends Error {
  code: CollectionFailureCode
  constructor(code: CollectionFailureCode) {
    super(code)
    this.code = code
  }
}
export interface CollectionState {
  status: 'loading' | 'ready' | 'error'
  data: CollectionSnapshot | null
  busy: boolean
  pending: PendingOperation | null
  receipt: CollectionReceipt | null
  error: CollectionFailureCode | null
}
