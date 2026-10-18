import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  listPlayableCards,
  listBattleSpecies,
  getPlayableCard,
  createPlayableBattle,
} from './playable-roster.ts'
import { createPractice, practiceReducer } from './practice.ts'
import { activeFighter } from './battle-state.ts'
import { resolveTurn } from './turn-engine.ts'
import { getTypeEffectiveness } from './type-chart.ts'
import { validatePracticeTeam } from './practice-team.ts'

const picks = [
  { species: 152, ids: ['xy9-1', 'A4-162'], types: ['grass'] },
  { species: 155, ids: ['swsh10-023', 'A4-165'], types: ['fire'] },
  { species: 158, ids: ['sv05-039', 'A4-167'], types: ['water'] },
  { species: 196, ids: ['sv03-086', 'sv08.5-155'], types: ['psychic'] },
  { species: 197, ids: ['sv03-130', 'sv08.5-161'], types: ['dark'] },
  { species: 212, ids: ['sv03-141', 'sv03-205'], types: ['bug', 'steel'] },
]
const team = picks.map((p) => p.ids[0])

test('Johto adds twelve exact variants with distinct profiles, rarity budgets and a legal team', () => {
  for (const pick of picks) {
    const [base, rare] = pick.ids.map(getPlayableCard)
    assert.ok(base, pick.ids[0])
    assert.ok(rare, pick.ids[1])
    assert.equal(base.speciesId, pick.species)
    assert.equal(rare.speciesId, pick.species)
    assert.deepEqual(base.types, pick.types)
    assert.deepEqual(rare.types, pick.types)
    assert.notDeepEqual(base.points, rare.points)
    assert.ok(rare.budget > base.budget)
    for (const card of [base, rare]) {
      assert.equal(card.moves.length, 4)
      assert.ok(card.moves.some((m) => m.kind === 'damage' && m.cooldown === 0))
    }
  }
  assert.deepEqual(validatePracticeTeam(team), { valid: true, cardIds: team })
  assert.equal(getPlayableCard('neo1-53'), undefined)
  assert.equal(listPlayableCards().length, 48)
  assert.equal(listBattleSpecies().length, 24)
})

test('Johto expansion preserves every previous species and card profile exactly', () => {
  const oldIds = new Set([1, 3, 4, 6, 7, 9, 25, 37, 39, 63, 66, 92, 94, 95, 131, 133, 143, 149])
  const old = {
    species: listBattleSpecies().filter((s) => oldIds.has(s.speciesId)),
    cards: listPlayableCards().filter((c) => oldIds.has(c.speciesId)),
  }
  assert.equal(
    createHash('sha256').update(JSON.stringify(old)).digest('hex'),
    '3012da0686a49d9278d09bbdbbcf827f6854feeab2b6e11c69f485699a09f84d',
  )
})

test('new dark and steel cards use actual engine immunities without invented TCG effects', () => {
  const player = [team[3], ...team.filter((id) => id !== team[3])]
  const rival = [team[4], ...team.filter((id) => id !== team[4])]
  let state = createPlayableBattle('dark-immunity', [player, rival])
  let result = resolveTurn(
    state,
    [{ kind: 'move', actorId: player[0], moveId: 'pokeapi-94' }, { kind: 'pass' }],
    state.version,
    0,
  )
  assert.ok(result.events.some((e) => e.kind === 'damage' && e.side === 1 && e.amount === 0))
  const steel = [team[5], ...team.filter((id) => id !== team[5])]
  state = createPlayableBattle('steel-immunity', [player, steel])
  result = resolveTurn(
    state,
    [{ kind: 'move', actorId: player[0], moveId: 'pokeapi-92' }, { kind: 'pass' }],
    state.version,
    0,
  )
  assert.equal(activeFighter(result.state, 1).status, null)
  assert.ok(result.events.some((e) => e.kind === 'status' && e.outcome === 'immune'))
})

test('both Johto variant teams complete reproducible practice battles against every opponent', () => {
  for (const variant of [0, 1])
    for (const opponent of ['rookie', 'balanced', 'elite']) {
      const run = () => {
        let session = createPractice(
          'johto-' + opponent,
          picks.map((p) => p.ids[variant]),
          false,
          opponent,
        )
        let transitions = 0
        while (session.battle.phase !== 'finished') {
          const battle = session.battle
          const actor = activeFighter(battle, 0)
          const common = { battleId: battle.battleId, expectedVersion: battle.version }
          if (battle.phase === 'replacement') {
            const target = battle.sides[0].fighters.find((f) => f.hp > 0)!
            session = practiceReducer(session, { ...common, kind: 'replace', targetId: target.id })!
          } else {
            const target = activeFighter(battle, 1)
            const move = actor.moves
              .filter((m) => m.kind === 'damage' && actor.readyOn[m.id] <= battle.turn)
              .sort(
                (a, b) =>
                  b.power * getTypeEffectiveness(b.type, target.types) -
                  a.power * getTypeEffectiveness(a.type, target.types),
              )[0]
            session = practiceReducer(session, {
              ...common,
              kind: 'turn',
              action: move
                ? { kind: 'move', actorId: actor.id, moveId: move.id }
                : { kind: 'pass' },
              tieBreak: 0,
            })!
          }
          assert.ok(++transitions <= 120)
          for (const side of session.battle.sides)
            for (const fighter of side.fighters)
              assert.ok(fighter.hp >= 0 && fighter.hp <= fighter.maxHp)
        }
        assert.ok(session.battle.result)
        return session
      }
      assert.deepEqual(run(), run())
    }
})
