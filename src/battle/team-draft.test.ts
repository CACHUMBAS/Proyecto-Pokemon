import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { CardRecord, SpeciesRecord } from '../catalog/types.ts'
import {
  readTeamDraft,
  saveTeamDraft,
  restoreTeamDraft,
  selectTeamCard,
  InvalidTeamDraftError,
} from './team-draft.ts'

const makeCard = (id: number, variant = ''): CardRecord => ({
  id: `card-${id}${variant}`,
  origin: 'tcgdex',
  category: 'Pokemon',
  localizations: { en: { name: `Pokemon ${id}`, imageUrl: null } },
  speciesIds: [id],
  mapping: 'species',
  rarity: 'Common',
  tcgTypes: [],
  set: { id: 'test', name: 'Test' },
  illustrator: null,
})
const species = new Set([1, 2, 3, 4, 5, 6, 7])
const cards = [...species].slice(0, 6).map((id) => makeCard(id))
const getStorage = (raw: string | null) => () => ({ getItem: () => raw, setItem: () => {} })
const serialize = (members: unknown) => JSON.stringify({ version: 1, members })

test('an empty or partial local draft is accepted without claiming ownership', () => {
  assert.deepEqual(readTeamDraft(getStorage(null)), {
    kind: 'ready',
    draft: { version: 1, members: [] },
  })
  assert.deepEqual(readTeamDraft(getStorage(serialize([{ cardId: 'card-1', speciesId: 1 }]))), {
    kind: 'ready',
    draft: { version: 1, members: [{ cardId: 'card-1', speciesId: 1 }] },
  })
})

test('malformed, future-version, oversized or duplicate drafts are not silently overwritten', () => {
  const invalid = [
    '{',
    'null',
    '{}',
    JSON.stringify({ version: 2, members: [] }),
    serialize([null]),
    serialize([{ cardId: '', speciesId: 1 }]),
    serialize([{ cardId: 'one', speciesId: -1 }]),
    serialize([
      { cardId: 'one', speciesId: 1 },
      { cardId: 'two', speciesId: 1 },
    ]),
    serialize([
      { cardId: 'one', speciesId: 1 },
      { cardId: 'one', speciesId: 2 },
    ]),
    serialize([...species].map((id) => ({ cardId: `card-${id}`, speciesId: id }))),
  ]
  for (const raw of invalid) assert.deepEqual(readTeamDraft(getStorage(raw)), { kind: 'invalid' })
})

test('blocked storage and quota failures remain usable in memory', () => {
  const blocked = () => {
    throw new Error('blocked')
  }
  assert.deepEqual(readTeamDraft(blocked), { kind: 'unavailable' })
  assert.equal(saveTeamDraft(cards, blocked), 'unavailable')
  assert.equal(
    saveTeamDraft(cards, () => ({
      getItem: () => null,
      setItem() {
        throw new Error('quota')
      },
    })),
    'unavailable',
  )
})

test('only versioned identity references are saved, never trusted card data or stats', () => {
  let saved = ''
  assert.equal(
    saveTeamDraft(cards, () => ({
      getItem: () => null,
      setItem(_key, value) {
        saved = value
      },
    })),
    'saved',
  )
  assert.deepEqual(JSON.parse(saved), {
    version: 1,
    members: cards.map((card) => ({ cardId: card.id, speciesId: card.speciesIds[0] })),
  })
})

const repository = {
  async load() {
    return { species: [...species].map((id) => ({ id }) as SpeciesRecord) }
  },
  async listVariants(id: number) {
    return [makeCard(id), makeCard(id, '-rare')]
  },
}

test('restored identities resolve through the catalog in saved order', async () => {
  const restored = await restoreTeamDraft(
    {
      version: 1,
      members: [
        { cardId: 'card-3-rare', speciesId: 3 },
        { cardId: 'card-1', speciesId: 1 },
      ],
    },
    repository,
  )
  assert.deepEqual(restored, [makeCard(3, '-rare'), makeCard(1)])
})

test('forged or stale card/species references and ambiguous mappings are rejected on restore', async () => {
  for (const member of [
    { cardId: 'card-2', speciesId: 1 },
    { cardId: 'card-99', speciesId: 99 },
  ]) {
    await assert.rejects(
      restoreTeamDraft({ version: 1, members: [member] }, repository),
      InvalidTeamDraftError,
    )
  }
  await assert.rejects(
    restoreTeamDraft(
      { version: 1, members: [{ cardId: 'card-1', speciesId: 1 }] },
      {
        ...repository,
        async listVariants() {
          return [{ ...makeCard(1), mapping: 'multiple' as const, speciesIds: [1, 2] }]
        },
      },
    ),
    InvalidTeamDraftError,
  )
})

test('a network error is preserved for retry rather than treated as an empty draft', async () => {
  await assert.rejects(
    restoreTeamDraft(
      { version: 1, members: [{ cardId: 'card-1', speciesId: 1 }] },
      {
        ...repository,
        async listVariants() {
          throw new Error('offline')
        },
      },
    ),
    /offline/,
  )
})

test('selecting a variant replaces the same species in its original slot, even in a full team', () => {
  const original = structuredClone(cards)
  const result = selectTeamCard(cards, makeCard(3, '-rare'), species)
  assert.equal(result.kind, 'replaced')
  assert.deepEqual(
    result.cards.map((card) => card.id),
    ['card-1', 'card-2', 'card-3-rare', 'card-4', 'card-5', 'card-6'],
  )
  assert.deepEqual(cards, original)
  assert.equal(selectTeamCard(cards, cards[0], species).kind, 'unchanged')
})

test('selection adds eligible Pokemon but rejects a seventh, support cards and ambiguous mappings', () => {
  assert.equal(selectTeamCard(cards.slice(0, 5), cards[5], species).kind, 'added')
  assert.equal(selectTeamCard(cards, makeCard(7), species).kind, 'full')
  assert.equal(
    selectTeamCard([], { ...makeCard(1), category: 'Trainer' }, species).kind,
    'ineligible',
  )
  assert.equal(
    selectTeamCard([], { ...makeCard(1), mapping: 'multiple', speciesIds: [1, 2] }, species).kind,
    'ineligible',
  )
  assert.equal(selectTeamCard([], makeCard(99), species).kind, 'ineligible')
})

test('a stale tab cannot overwrite newer saved selections', () => {
  let raw = serialize([
    { cardId: 'card-1', speciesId: 1 },
    { cardId: 'card-2', speciesId: 2 },
  ])
  const before = raw
  const result = saveTeamDraft(
    [makeCard(3)],
    () => ({
      getItem: () => raw,
      setItem(_key, value) {
        raw = value
      },
    }),
    {
      version: 1,
      members: [{ cardId: 'card-1', speciesId: 1 }],
    },
  )
  assert.equal(result, 'conflict')
  assert.equal(raw, before)
})
