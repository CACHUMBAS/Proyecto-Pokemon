import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { listTeamSpecies, listTeamVariants, getTeamBattleDetails } from './team-catalog.ts'
import { listPlayableCards, listBattleSpecies } from './playable-roster.ts'
import { validatePracticeTeam } from './practice-team.ts'
import { DEFAULT_PLAYER } from './practice.ts'
import type { CardRecord, SpeciesRecord } from '../catalog/types.ts'

const manifest = JSON.parse(
  readFileSync(new URL('../../public/catalog/manifest.json', import.meta.url), 'utf8'),
)
const species: SpeciesRecord[] = JSON.parse(
  readFileSync(new URL('../../public' + manifest.speciesFile, import.meta.url), 'utf8'),
)
const variants = (id: number): CardRecord[] =>
  JSON.parse(
    readFileSync(
      new URL('../../public' + manifest.variantsPath + '/' + id + '.json', import.meta.url),
      'utf8',
    ),
  )
const playable = listPlayableCards()

// Filtering after pagination would lose playable species on later catalogue pages.
test('filters supported species before pagination and combines name, type and dex searches', () => {
  const before = JSON.stringify(species)
  const expected = species
    .filter((s) => playable.some((c) => c.speciesId === s.id))
    .map((s) => s.id)
  const first = listTeamSpecies(species, { pageSize: 12 }, true)
  const second = listTeamSpecies(species, { pageSize: 12, page: 2 }, true)
  assert.equal(first.total, 18)
  assert.equal(first.pages, 2)
  assert.deepEqual(
    [...first.items, ...second.items].map((s) => s.id),
    expected,
  )
  for (const locale of ['es', 'en'] as const) {
    assert.deepEqual(
      listTeamSpecies(species, { search: 'Pikachu', type: 'electric', locale }, true).items.map(
        (s) => s.id,
      ),
      [25],
    )
    assert.deepEqual(
      listTeamSpecies(species, { search: '#0025', type: 'electric', locale }, true).items.map(
        (s) => s.id,
      ),
      [25],
    )
  }
  assert.equal(
    listTeamSpecies(species, { search: 'Pikachu', type: 'fire', page: 99 }, true).total,
    0,
  )
  assert.equal(listTeamSpecies(species, { search: '#1025' }, true).total, 0)
  assert.equal(listTeamSpecies(species, {}, false).total, species.length)
  assert.equal(JSON.stringify(species), before)
})

// A species match alone must never enable its other illustrations or support cards.
test('filters exact compatible illustrations with text search, preserving order and catalogue data', () => {
  const cards = variants(1)
  const before = JSON.stringify(cards)
  const expected = cards.filter((c) => playable.some((p) => p.id === c.id))
  assert.equal(expected.length, 2)
  assert.deepEqual(listTeamVariants(cards, '', true), expected)
  assert.deepEqual(
    listTeamVariants(cards, '  BASE1-44  ', true).map((c) => c.id),
    ['base1-44'],
  )
  assert.deepEqual(
    listTeamVariants(cards, 'Base Set', true).map((c) => c.id),
    ['base1-44'],
  )
  assert.deepEqual(
    listTeamVariants(cards, 'Common', true).map((c) => c.id),
    ['base1-44'],
  )
  assert.equal(listTeamVariants(cards, '2021swsh-1', true).length, 0)
  assert.equal(listTeamVariants(cards, '2021swsh-1', false).length, 1)
  assert.deepEqual(listTeamVariants(cards, '', false), cards)
  assert.equal(listTeamVariants(variants(1025), '', true).length, 0)
  const valid = cards.find((c) => c.id === 'base1-44')!
  const invalid: CardRecord[] = [
    { ...valid, category: 'Trainer', mapping: 'support' },
    { ...valid, mapping: 'multiple', speciesIds: [1, 2] },
    { ...valid, speciesIds: [25] },
    { ...valid, id: 'unknown' },
  ]
  assert.deepEqual(listTeamVariants(invalid, '', true), [])
  assert.equal(JSON.stringify(cards), before)
})

test('every offered variant matches the combat roster and can form the existing practice team', () => {
  const offered = listTeamSpecies(species, { pageSize: 48 }, true).items.flatMap((s) =>
    listTeamVariants(variants(s.id), '', true),
  )
  assert.deepEqual(offered.map((c) => c.id).sort(), playable.map((c) => c.id).sort())
  const ids = DEFAULT_PLAYER.map((id) => offered.find((c) => c.id === id)!.id)
  assert.deepEqual(validatePracticeTeam(ids), { valid: true, cardIds: ids })
})

// The preview must show the exact engine profile, never TCG text or raw PokeAPI power.
test('battle details match every exact engine variant and use localized verified move names', () => {
  const battleSpecies = listBattleSpecies()
  for (const fighter of playable) {
    const card = variants(fighter.speciesId).find((c) => c.id === fighter.id)!
    const details = getTeamBattleDetails(card)
    assert.ok(details, fighter.id)
    assert.equal(details.id, fighter.id)
    assert.deepEqual(details.types, fighter.types)
    assert.deepEqual(details.stats, {
      maxHp: fighter.maxHp,
      attack: fighter.attack,
      defense: fighter.defense,
      speed: fighter.speed,
    })
    assert.deepEqual(
      details.moves,
      fighter.moves.map((move) => ({
        ...move,
        names: battleSpecies
          .find((s) => s.speciesId === fighter.speciesId)!
          .moves.find((m) => m.move.id === move.id)!.names,
      })),
    )
  }
  const bulbasaur = getTeamBattleDetails(variants(1).find((c) => c.id === 'base1-44')!)!
  const whip = bulbasaur.moves.find((m) => m.id === 'pokeapi-22')!
  assert.equal(whip.power, 40)
  assert.deepEqual(whip.names, { es: 'Látigo Cepa', en: 'Vine Whip' })
  assert.equal(whip.cooldown, 0)
  assert.ok(bulbasaur.moves.some((m) => m.kind === 'status' && m.power === 0 && m.cooldown === 2))
})

test('battle details distinguish illustrations and reject unsupported or ambiguous catalogue associations', () => {
  const cards = variants(1)
  const common = cards.find((c) => c.id === 'base1-44')!
  const rare = cards.find((c) => c.id === 'sv03.5-166')!
  const commonDetails = getTeamBattleDetails(common)
  const rareDetails = getTeamBattleDetails(rare)
  assert.ok(commonDetails)
  assert.ok(rareDetails)
  assert.notDeepEqual(commonDetails.stats, rareDetails.stats)
  for (const card of [
    cards.find((c) => c.id === '2021swsh-1')!,
    { ...common, id: 'unknown' },
    { ...common, category: 'Trainer', mapping: 'support' },
    { ...common, mapping: 'multiple', speciesIds: [1, 25] },
    { ...common, speciesIds: [25] },
  ] as CardRecord[]) {
    assert.equal(getTeamBattleDetails(card), undefined)
  }
})

test('reading and changing a preview cannot mutate the catalogue or later battle profiles', () => {
  const card = variants(1).find((c) => c.id === 'base1-44')!
  const before = JSON.stringify(card)
  const details = getTeamBattleDetails(Object.freeze(card))
  assert.ok(details)
  const original = structuredClone(details)
  details.stats.maxHp = 1
  details.moves[0].names.es = 'changed'
  details.moves.reverse()
  assert.equal(JSON.stringify(card), before)
  assert.deepEqual(getTeamBattleDetails(card), original)
  assert.deepEqual(listPlayableCards(), playable)
})
