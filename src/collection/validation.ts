import {
  CollectionFailure,
  type CollectionSnapshot,
  type CollectionReceipt,
  type PendingOperation,
} from './types.ts'
const budgets = [240, 252, 264, 276, 288]
function check(condition: unknown): asserts condition {
  if (!condition) throw new CollectionFailure('invalidData')
}
function record(value: unknown): Record<string, unknown> {
  check(value && typeof value === 'object' && !Array.isArray(value))
  return value as Record<string, unknown>
}
function integer(value: unknown, min = 0, max = 1000000000): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max
}
function id(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9.-]{0,80}$/.test(value)
}
function uuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  )
}
function list(value: unknown, max = 5000): unknown[] {
  check(Array.isArray(value) && value.length <= max)
  return value
}
function unique(items: string[]) {
  check(new Set(items).size === items.length)
}
export function parseReceipt(input: unknown, userId: string): CollectionReceipt {
  const r = record(input)
  check(r.user_id === userId && uuid(r.request_id) && id(r.reference))
  check(typeof r.kind === 'string' && ['starter', 'pack', 'fragment'].includes(r.kind))
  const cards = list(r.card_ids, 6)
  check(cards.every(id))
  check(
    integer(r.quantity, 1, 1000000) &&
      integer(r.coins_delta, -1000000000) &&
      integer(r.fragments_delta, -1000000000),
  )
  check(typeof r.created_at === 'string' && Number.isFinite(Date.parse(r.created_at)))
  if (r.kind === 'starter') {
    check(
      cards.length === 6 &&
        r.quantity === 6 &&
        r.currency === null &&
        r.coins_delta === 0 &&
        r.fragments_delta === 0,
    )
    unique(cards as string[])
  } else if (r.kind === 'pack') {
    check(
      cards.length === 3 &&
        r.quantity === 3 &&
        typeof r.currency === 'string' &&
        ['welcome', 'coins', 'fragments'].includes(r.currency),
    )
    if (r.currency === 'welcome') check(r.coins_delta === 0 && r.fragments_delta === 0)
    if (r.currency === 'coins') check(r.coins_delta < 0 && r.fragments_delta === 0)
    if (r.currency === 'fragments') check(r.fragments_delta < 0 && r.coins_delta === 0)
  } else
    check(
      cards.length === 1 &&
        cards[0] === r.reference &&
        r.currency === null &&
        r.coins_delta === 0 &&
        r.fragments_delta > 0,
    )
  return structuredClone(r) as unknown as CollectionReceipt
}
export function parseCollection(input: unknown, userId: string): CollectionSnapshot {
  const s = record(input),
    w = record(s.wallet),
    p = record(s.pack)
  check(s.user_id === userId && s.version === 'lumemon-economy-v1')
  check(
    integer(w.coins) &&
      integer(w.fragments) &&
      integer(w.revision) &&
      typeof w.welcome_available === 'boolean',
  )
  check(w.starter_id === null || id(w.starter_id))
  const cards = list(s.cards).map(record)
  check(cards.length > 0)
  cards.forEach((c) =>
    check(
      id(c.card_id) &&
        integer(c.species_id, 1) &&
        typeof c.budget === 'number' &&
        budgets.includes(c.budget) &&
        integer(c.fragment_value, 1, 1000000),
    ),
  )
  const cardMap = new Map(cards.map((c) => [c.card_id, c]))
  check(cardMap.size === cards.length)
  const inventory = list(s.inventory).map(record)
  inventory.forEach((c) => check(cardMap.has(c.card_id) && integer(c.quantity, 1, 1000000)))
  unique(inventory.map((c) => c.card_id as string))
  const starters = list(s.starters, 10).map(record)
  check(starters.length > 0)
  starters.forEach((s) => {
    const ids = list(s.card_ids, 6)
    check(id(s.id) && ids.length === 6 && ids.every((x) => cardMap.has(x)))
    unique(ids as string[])
    check(new Set(ids.map((x) => cardMap.get(x)!.species_id)).size === 6)
  })
  unique(starters.map((s) => s.id as string))
  check(w.starter_id === null || starters.some((s) => s.id === w.starter_id))
  check(id(p.id) && integer(p.coins, 1) && integer(p.fragments, 1) && p.size === 3)
  const odds = list(p.odds, 5).map(record)
  check(odds.length === 5)
  unique(odds.map((o) => String(o.budget)))
  odds.forEach((o) =>
    check(
      typeof o.budget === 'number' &&
        budgets.includes(o.budget) &&
        integer(o.weight, 1, 10000) &&
        integer(o.card_count, 1) &&
        o.card_count === cards.filter((c) => c.budget === o.budget).length,
    ),
  )
  check(odds.reduce((sum, o) => sum + Number(o.weight), 0) === 10000)
  const events = list(s.events, 20).map((e) => parseReceipt(e, userId))
  unique(events.map((e) => e.request_id))
  events.forEach((e) => check(e.card_ids.every((id) => cardMap.has(id))))
  return structuredClone({ ...s, events }) as unknown as CollectionSnapshot
}
export function parsePending(input: unknown): PendingOperation {
  const p = record(input),
    c = record(p.command)
  check(uuid(p.requestId))
  if (c.kind === 'starter') check(id(c.starterId))
  else if (c.kind === 'pack')
    check(
      id(c.packId) &&
        typeof c.currency === 'string' &&
        ['welcome', 'coins', 'fragments'].includes(c.currency),
    )
  else if (c.kind === 'fragment') check(id(c.cardId) && integer(c.quantity, 1, 1000000))
  else check(false)
  return structuredClone(p) as unknown as PendingOperation
}
