import type {
  BattleRoster,
  BattleSpecies,
  VerifiedMove,
  BaseStats,
} from '../../src/battle/data-types.ts'
import type { BattleMove, Status } from '../../src/battle/engine-types.ts'
import type { PokemonType } from '../../src/battle/types.ts'
import { assertPokemonTypes } from '../../src/battle/type-chart.ts'
import { assignVariantProfiles, getStatBudget } from '../../src/battle/profiles.ts'
import { ensure, sha256, POKEAPI_COMMIT } from './sources.ts'
import type { Selection, BattleSources, BattleCatalog } from './sources.ts'
type Row = Record<string, string>
function one(rows: Row[], field: string, value: string): Row {
  const found = rows.filter((row) => row[field] === value)
  ensure(found.length === 1, 'unique source row ' + field + '=' + value)
  return found[0]
}
function integer(value: string, positive = false): number {
  ensure(/^-?\d+$/.test(value), 'source integer')
  const number = Number(value)
  ensure(Number.isSafeInteger(number) && (!positive || number > 0), 'source integer range')
  return number
}
function names(rows: Row[]): { es: string; en: string } {
  const es = one(rows, 'local_language_id', '7').name
  const en = one(rows, 'local_language_id', '9').name
  ensure(
    typeof es === 'string' && es.length > 0 && typeof en === 'string' && en.length > 0,
    'localized names',
  )
  return { es, en }
}
export function buildRoster(
  selection: Selection,
  sources: BattleSources,
  catalog: BattleCatalog,
): BattleRoster {
  ensure(
    sources.manifest.pokeapiCommit === POKEAPI_COMMIT && /^[a-f0-9]{64}$/.test(sources.digest),
    'source identity',
  )
  ensure(selection.catalogVersion === catalog.version, 'catalog mismatch')
  ensure(selection.versionGroupId === 18, 'move version group')
  ensure(Array.isArray(selection.species) && selection.species.length >= 6, 'starter species')
  const t = sources.tables
  const version = one(t.version_groups, 'id', String(selection.versionGroupId))
  ensure(version.identifier === 'ultra-sun-ultra-moon', 'version group identity')
  const speciesIds = new Set<number>(),
    cardIds = new Set<string>()
  const species: BattleSpecies[] = []
  const cards: BattleRoster['cards'] = []
  for (const pick of [...selection.species].sort((a, b) => a.speciesId - b.speciesId)) {
    ensure(
      Number.isSafeInteger(pick.speciesId) && pick.speciesId > 0 && !speciesIds.has(pick.speciesId),
      'species selection',
    )
    speciesIds.add(pick.speciesId)
    const defaults = t.pokemon.filter(
      (p) => p.species_id === String(pick.speciesId) && p.is_default === '1',
    )
    ensure(defaults.length === 1, 'default Pokemon')
    const pokemon = defaults[0],
      pokemonId = integer(pokemon.id, true)
    const catalogSpecies = catalog.species.filter((s) => s.id === pick.speciesId)
    ensure(catalogSpecies.length === 1, 'catalog species')
    const form = catalogSpecies[0].forms.filter((f) => f.isDefault)
    ensure(
      form.length === 1 && form[0].id === pokemonId && form[0].slug === pokemon.identifier,
      'catalog default form',
    )
    const typeRows = t.pokemon_types
      .filter((r) => r.pokemon_id === pokemon.id)
      .sort((a, b) => integer(a.slot) - integer(b.slot))
    ensure(
      typeRows.length >= 1 &&
        typeRows.length <= 2 &&
        typeRows.every((r, i) => integer(r.slot) === i + 1),
      'type slots',
    )
    const types = typeRows.map((r) => one(t.types, 'id', r.type_id).identifier) as PokemonType[]
    try {
      assertPokemonTypes(types)
    } catch {
      throw new Error('Invalid battle types')
    }
    ensure(types.join(',') === catalogSpecies[0].types.join(','), 'catalog species types')
    const statRows = t.pokemon_stats.filter((r) => r.pokemon_id === pokemon.id)
    ensure(statRows.length === 6, 'six base stats')
    const expectedStats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
    const baseStats = expectedStats.map((name, index) => {
      const id = String(index + 1)
      ensure(one(t.stats, 'id', id).identifier === name, 'stat ID')
      return integer(one(statRows, 'stat_id', id).base_stat, true)
    }) as unknown as BaseStats
    const localized = names(
      t.pokemon_species_names.filter((r) => r.pokemon_species_id === String(pick.speciesId)),
    )
    ensure(
      localized.en === catalogSpecies[0].names.en && localized.es === catalogSpecies[0].names.es,
      'catalog species names',
    )
    ensure(
      Array.isArray(pick.moves) && pick.moves.length >= 1 && pick.moves.length <= 4,
      'selected moves',
    )
    const moveIds = new Set<number>()
    const moves: VerifiedMove[] = pick.moves.map((pickMove) => {
      ensure(
        Number.isSafeInteger(pickMove.moveId) &&
          pickMove.moveId > 0 &&
          !moveIds.has(pickMove.moveId),
        'selected move ID',
      )
      moveIds.add(pickMove.moveId)
      const id = String(pickMove.moveId)
      const sourceMove = one(t.moves, 'id', id),
        meta = one(t.move_meta, 'move_id', id)
      const typeId = integer(sourceMove.type_id, true)
      const type = one(t.types, 'id', String(typeId)).identifier as PokemonType
      assertPokemonTypes([type])
      const power = sourceMove.power === '' ? null : integer(sourceMove.power)
      const damageClassId = integer(sourceMove.damage_class_id, true)
      const ailment = one(t.move_meta_ailments, 'id', meta.meta_ailment_id).identifier
      const learned = t.pokemon_moves.filter(
        (r) => r.pokemon_id === pokemon.id && r.version_group_id === version.id && r.move_id === id,
      )
      ensure(
        learned.length > 0,
        'move compatibility ' + pokemon.identifier + '/' + sourceMove.identifier,
      )
      const learnedBy = learned
        .map((r) => {
          const level = integer(r.level)
          ensure(level >= 0, 'move level')
          const method = one(t.pokemon_move_methods, 'id', r.pokemon_move_method_id)
          return { methodId: integer(method.id, true), method: method.identifier, level }
        })
        .sort((a, b) => a.methodId - b.methodId || a.level - b.level)
      let move: BattleMove
      if (pickMove.profile === 'basic' || pickMove.profile === 'strong') {
        ensure(
          (damageClassId === 2 || damageClassId === 3) && power !== null && power > 0,
          'damage move profile',
        )
        move = {
          id: 'pokeapi-' + id,
          type,
          kind: 'damage',
          power: pickMove.profile === 'basic' ? 40 : 60,
          cooldown: pickMove.profile === 'basic' ? 0 : 1,
        }
      } else {
        const states: Status[] = ['poison', 'burn', 'paralysis', 'sleep', 'freeze']
        ensure(
          states.includes(pickMove.profile) &&
            damageClassId === 1 &&
            meta.meta_category_id === '1' &&
            ailment === pickMove.profile &&
            (power === null || power === 0),
          'pure status profile',
        )
        move = {
          id: 'pokeapi-' + id,
          type,
          kind: 'status',
          power: 0,
          cooldown: 2,
          status: pickMove.profile,
        }
      }
      return {
        move,
        names: names(t.move_names.filter((r) => r.move_id === id)),
        source: {
          moveId: pickMove.moveId,
          slug: sourceMove.identifier,
          typeId,
          damageClassId,
          power,
          accuracy: sourceMove.accuracy === '' ? null : integer(sourceMove.accuracy),
          priority: integer(sourceMove.priority),
          ailment,
          learnedBy,
        },
      }
    })
    ensure(
      moves.some((m) => m.move.kind === 'damage' && m.move.cooldown === 0),
      'basic move required',
    )
    const entry: BattleSpecies = {
      speciesId: pick.speciesId,
      pokemonId,
      slug: pokemon.identifier,
      names: localized,
      baseStats,
      types,
      moves,
    }
    species.push(entry)
    ensure(Array.isArray(pick.cardIds) && pick.cardIds.length > 0, 'selected cards')
    const selectedCards = pick.cardIds.map((id) => {
      ensure(typeof id === 'string' && id.length > 0 && !cardIds.has(id), 'selected card ID')
      cardIds.add(id)
      const matches = catalog.cards.filter((c) => c.id === id)
      ensure(matches.length === 1, 'unique catalog card')
      const card = matches[0]
      ensure(
        card.origin === 'tcgdex' &&
          card.category === 'Pokemon' &&
          card.mapping === 'species' &&
          card.speciesIds.length === 1 &&
          card.speciesIds[0] === pick.speciesId,
        'unambiguous Pokemon card',
      )
      ensure(card.localizations.en?.imageUrl || card.localizations.es?.imageUrl, 'card artwork')
      return { card, id, budget: getStatBudget(card) }
    })
    const assignments = assignVariantProfiles(baseStats, selectedCards)
    for (const a of assignments) {
      const card = selectedCards.find((c) => c.id === a.id)!.card
      cards.push({
        id: a.id,
        speciesId: pick.speciesId,
        rarity: card.rarity,
        budget: a.budget,
        profile: a.profile,
        ...a.stats,
        types: [...types],
        moves: structuredClone(moves.map((m) => m.move)),
      })
    }
  }
  const payload = {
    schemaVersion: 1 as const,
    catalogVersion: catalog.version,
    source: {
      pokeapiCommit: POKEAPI_COMMIT,
      sourcesDigest: sources.digest,
      selectionDigest: sha256(JSON.stringify(selection)),
      versionGroup: { id: 18, slug: version.identifier },
    },
    species,
    cards,
  }
  return { ...payload, version: 'lumemon-roster-' + sha256(JSON.stringify(payload)).slice(0, 16) }
}
