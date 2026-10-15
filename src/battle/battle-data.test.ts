import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { buildRoster } from '../../scripts/battle/build-roster.ts'
import { loadSources, loadCatalog, parseSources } from '../../scripts/battle/sources.ts'
import type { Selection, SourceManifest } from '../../scripts/battle/sources.ts'
import { listPlayableCards, getPlayableCard, createPlayableBattle } from './playable-roster.ts'
import { resolveTurn, resolveReplacements } from './turn-engine.ts'
import type { BattleAction, Side } from './engine-types.ts'
const root = fileURLToPath(new URL('../../', import.meta.url))
const selection: Selection = JSON.parse(
  readFileSync(resolve(root, 'scripts/battle/selection.json'), 'utf8'),
)
const build = () => buildRoster(selection, loadSources(root), loadCatalog(root, selection))
test('source integrity rejects altered bytes, headers or pinned revision', () => {
  const manifest: SourceManifest = JSON.parse(
    readFileSync(resolve(root, 'src/battle/data/sources/manifest.json'), 'utf8'),
  )
  const raw = Object.fromEntries(
    Object.keys(manifest.files).map((n) => [
      n,
      readFileSync(resolve(root, 'src/battle/data/sources/' + n + '.csv'), 'utf8'),
    ]),
  )
  assert.equal(Object.keys(parseSources(manifest, raw).tables).length, 13)
  assert.throws(
    () =>
      parseSources(manifest, { ...raw, pokemon_stats: raw.pokemon_stats.replace(',35,', ',36,') }),
    /Invalid/,
  )
  assert.throws(() => parseSources({ ...manifest, pokeapiCommit: 'wrong' }, raw), /Invalid/)
  const altered = structuredClone(manifest)
  altered.files.moves.header = 'wrong'
  assert.throws(() => parseSources(altered, raw), /Invalid/)
})
test('roster is deterministic, exactly 36 known cards, 18 default species, and one move version', () => {
  const roster = build()
  assert.deepEqual(build(), roster)
  assert.equal(roster.cards.length, 36)
  assert.equal(roster.species.length, 18)
  assert.equal(roster.source.versionGroup.id, 18)
  assert.equal(roster.source.versionGroup.slug, 'ultra-sun-ultra-moon')
  for (const s of roster.species) {
    assert.equal(s.speciesId, s.pokemonId)
    assert(s.moves.some((m) => m.move.power === 40 && m.move.cooldown === 0))
    for (const m of s.moves) {
      assert(m.names.es && m.names.en)
      assert(m.source.learnedBy.length > 0)
      assert.equal(m.move.id, 'pokeapi-' + m.source.moveId)
    }
    const variants = roster.cards.filter((c) => c.speciesId === s.speciesId)
    assert.equal(new Set(variants.map((c) => JSON.stringify(c.points))).size, 2)
    for (const c of variants) {
      assert.equal(
        c.points.reduce((a, b) => a + b, 0),
        c.budget,
      )
      assert.deepEqual(
        c.moves,
        s.moves.map((m) => m.move),
      )
    }
  }
  const pika = roster.species.find((s) => s.speciesId === 25)!
  assert.deepEqual(pika.baseStats, [35, 55, 40, 50, 50, 90])
  assert.equal(pika.moves.find((m) => m.source.moveId === 85)?.names.es, 'Rayo')
  assert.equal(pika.moves.find((m) => m.source.moveId === 85)?.move.power, 60)
  assert.equal(pika.moves.find((m) => m.source.moveId === 85)?.source.power, 90)
  const rare = roster.cards.find((c) => c.id === 'sv03.5-173')!
  assert.equal(rare.budget, 276)
})
test('generator rejects wrong compatibility, default form, status mapping, unknown rarity and ambiguous cards', () => {
  const sources = loadSources(root),
    catalog = loadCatalog(root, selection)
  const badSources = structuredClone(sources)
  badSources.tables.pokemon_moves = badSources.tables.pokemon_moves.filter(
    (r) => !(r.pokemon_id === '25' && r.move_id === '85'),
  )
  assert.throws(() => buildRoster(selection, badSources, catalog), /Invalid/)
  const badForm = structuredClone(sources)
  badForm.tables.pokemon[0].is_default = '0'
  assert.throws(() => buildRoster(selection, badForm, catalog), /Invalid/)
  const badStatus = structuredClone(selection)
  badStatus.species[0].moves[2].profile = 'burn'
  assert.throws(() => buildRoster(badStatus, sources, catalog), /Invalid/)
  const wrongVersion = structuredClone(selection)
  wrongVersion.versionGroupId = 25
  assert.throws(() => buildRoster(wrongVersion, sources, catalog), /Invalid/)
  const badCatalog = structuredClone(catalog)
  badCatalog.cards[0].rarity = 'Mystery Rare'
  assert.throws(() => buildRoster(selection, sources, badCatalog), /Invalid/)
  badCatalog.cards[0] = catalog.cards[0]
  badCatalog.cards[1] = { ...catalog.cards[1], mapping: 'multiple', speciesIds: [1, 2] }
  assert.throws(() => buildRoster(selection, sources, badCatalog), /Invalid/)
  const noStat = structuredClone(sources)
  noStat.tables.pokemon_stats.pop()
  assert.throws(() => buildRoster(selection, noStat, catalog), /Invalid/)
})
test('bundled snapshot matches generation and returns detached card data', () => {
  const roster = build()
  const actual = JSON.parse(
    readFileSync(resolve(root, 'src/battle/data/starter-roster.json'), 'utf8'),
  )
  assert.deepEqual(actual, roster)
  assert.deepEqual(listPlayableCards(), roster.cards)
  const c = getPlayableCard('base1-58')!
  assert(c)
  Object.assign(c, { maxHp: 1 })
  assert.notEqual(getPlayableCard('base1-58')?.maxHp, 1)
  assert.equal(getPlayableCard('not-enabled'), undefined)
})
test('adapter rejects unknown cards and duplicate species, without changing caller selections', () => {
  const cards = listPlayableCards()
  const team = selection.species.slice(0, 6).map((s) => s.cardIds[0])
  const other = selection.species.slice(6, 12).map((s) => s.cardIds[0])
  Object.freeze(team)
  Object.freeze(other)
  const state = createPlayableBattle('real-data-test', [team, other])
  assert.equal(state.sides[0].fighters.length, 6)
  assert.equal(state.sides[0].supports.length, 0)
  assert.equal(state.dataVersion, build().version)
  assert.equal(state.sides[0].fighters[0].maxHp, cards.find((c) => c.id === team[0])?.maxHp)
  assert.throws(
    () => createPlayableBattle('bad', [[...team.slice(0, 5), 'unknown'], other]),
    /Invalid/,
  )
  assert.throws(
    () =>
      createPlayableBattle('bad', [[...team.slice(0, 5), selection.species[0].cardIds[1]], other]),
    /Invalid/,
  )
  assert.throws(() => createPlayableBattle('bad', [team.slice(1), other]), /Invalid/)
})
test('verified roster completes a deterministic battle using the real engine', () => {
  const run = () => {
    let state = createPlayableBattle('roster-battle', [
      selection.species.slice(0, 6).map((s) => s.cardIds[0]),
      selection.species.slice(6, 12).map((s) => s.cardIds[1]),
    ])
    let transitions = 0
    while (state.phase !== 'finished') {
      if (state.phase === 'replacement')
        state = resolveReplacements(state, [null, null], state.version).state
      else {
        const actions = ([0, 1] as Side[]).map((side) => {
          const f = state.sides[side].fighters[state.sides[side].active]
          const m = f.moves.find((m) => m.kind === 'damage' && f.readyOn[m.id] <= state.turn)!
          return { kind: 'move', actorId: f.id, moveId: m.id } as BattleAction
        }) as [BattleAction, BattleAction]
        state = resolveTurn(state, actions, state.version, 0).state
      }
      transitions++
      assert(transitions <= 120)
      for (const side of state.sides)
        for (const f of side.fighters) assert(f.hp >= 0 && f.hp <= f.maxHp)
    }
    return state
  }
  assert.deepEqual(run(), run())
  assert(run().result)
})

const expansionIds = ['base1-15', 'base1-4', 'base1-2', 'base3-5', 'sv03.5-143', 'base3-4']
test('expanded species form a legal six-card practice team with their actual types and distinct variants', () => {
  const team = expansionIds.map((id) => getPlayableCard(id))
  assert.ok(team.every(Boolean), 'all six added species must be enabled')
  assert.deepEqual(
    team.map((c) => c!.speciesId),
    [3, 6, 9, 94, 143, 149],
  )
  assert.deepEqual(team[1]!.types, ['fire', 'flying'])
  assert.deepEqual(team[3]!.types, ['ghost', 'poison'])
  assert.deepEqual(team[5]!.types, ['dragon', 'flying'])
  const roster = build()
  const charizard = roster.species.find((s) => s.speciesId === 6)!
  assert.equal(charizard.moves.find((m) => m.source.moveId === 17)?.names.es, 'Ataque Ala')
  const dragonite = roster.species.find((s) => s.speciesId === 149)!
  assert.equal(dragonite.moves.find((m) => m.source.moveId === 239)?.move.type, 'dragon')
  assert.ok(getPlayableCard('sv03.5-199')!.budget > getPlayableCard('base1-4')!.budget)
  assert.notDeepEqual(getPlayableCard('base3-5')!.points, getPlayableCard('sv03.5-094')!.points)
  const state = createPlayableBattle('expanded', [expansionIds, expansionIds])
  assert.equal(state.sides[0].fighters.length, 6)
  assert.throws(
    () =>
      createPlayableBattle('not-enabled', [['base4-4', ...expansionIds.slice(1)], expansionIds]),
    /not enabled/,
  )
})
test('both variants of the expanded team can finish deterministic battles without invalid HP or stuck turns', () => {
  const variants = [
    expansionIds,
    ['sv03.5-198', 'sv03.5-199', 'sv03.5-200', 'sv03.5-094', 'base2-11', 'sv03.5-149'],
  ]
  for (const team of variants) {
    const run = () => {
      let state = createPlayableBattle('expanded-match', [
        team,
        ['base1-58', 'base1-44', 'base1-46', 'base1-63', 'base1-68', 'base2-54'],
      ])
      let transitions = 0
      while (state.phase !== 'finished') {
        if (state.phase === 'replacement')
          state = resolveReplacements(state, [null, null], state.version).state
        else {
          const actions = ([0, 1] as Side[]).map((side) => {
            const f = state.sides[side].fighters[state.sides[side].active]
            const move = f.moves.find((m) => m.kind === 'damage' && f.readyOn[m.id] <= state.turn)!
            return { kind: 'move', actorId: f.id, moveId: move.id } as BattleAction
          }) as [BattleAction, BattleAction]
          state = resolveTurn(state, actions, state.version, 1).state
        }
        assert.ok(++transitions <= 120)
        for (const side of state.sides)
          for (const f of side.fighters) assert.ok(f.hp >= 0 && f.hp <= f.maxHp)
      }
      return state
    }
    assert.deepEqual(run(), run())
  }
})
