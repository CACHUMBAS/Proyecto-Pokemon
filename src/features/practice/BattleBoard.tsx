import { useEffect, useRef, type ReactNode } from 'react'
import { matchesAction } from '../../battle/tutorial'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { activeFighter } from '../../battle/battle-state'
import { getTypeEffectiveness } from '../../battle/type-chart'
import type { BattleAction, BattleState } from '../../battle/engine-types'
import { fighterName, moveName, resultKey } from './practice-data'
import { OpponentSupports } from './OpponentSupports'
import { SupportActions } from './SupportActions'
import { PracticeCard } from './PracticeCard'

import type { PlaybackFrame } from '../../battle/playback'
import { BattleEffects } from './BattleEffects'
import { fighterMotion } from './fighter-motion'
import { describe } from './event-description'

interface Props {
  modeLabel?: string
  finishedNote?: string
  guide?: ReactNode
  allowedAction?: BattleAction | null
  motion: boolean
  frame: PlaybackFrame | null
  playing: boolean
  cueKey: string
  onSkip: () => void
  battle: BattleState
  selected: BattleAction | null
  onSelect: (action: BattleAction) => void
  onConfirm: () => void
  onReplace: (id: string) => void
  onRematch: () => void
}
export function BattleBoard({
  modeLabel,
  finishedNote,
  guide,
  allowedAction,
  battle,
  frame,
  motion,
  playing,
  cueKey,
  onSkip,
  selected,
  onSelect,
  onConfirm,
  onReplace,
  onRematch,
}: Props) {
  const { t, i18n } = useTranslation()
  const arena = useRef<HTMLElement>(null)
  useEffect(() => {
    if (playing) arena.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }, [playing])
  const guided = allowedAction !== undefined
  const permits = (action: BattleAction) => !guided || matchesAction(allowedAction ?? null, action)
  useEffect(() => {
    if (guided && selected?.kind === 'switch') {
      const confirm = document.querySelector<HTMLButtonElement>('.practice-confirm')
      confirm?.scrollIntoView({ block: 'center', behavior: 'instant' })
      confirm?.focus({ preventScroll: true })
    }
  }, [guided, selected])
  const locale = i18n.language === 'en' ? 'en' : 'es'
  const player = activeFighter(battle, 0)
  const enemy = activeFighter(battle, 1)
  const replacement = battle.phase === 'replacement'
  const finished = battle.phase === 'finished'
  return (
    <>
      {battle.result && (
        <div className="practice-result" role="status">
          <span aria-hidden="true">✦</span>
          <div>
            <h2>{t('practice.' + resultKey(battle.result))}</h2>
            <p>
              {finishedNote ??
                t(
                  battle.result.kind === 'draw' && battle.result.reason === 'turn-limit'
                    ? 'practice.turnLimit'
                    : 'practice.finishedNote',
                )}
            </p>
          </div>
          <Button disabled={playing} onClick={onRematch}>
            {t('practice.rematch')}
          </Button>
        </div>
      )}
      <div className="practice-battle-grid">
        <section
          ref={arena}
          data-motion={motion ? 'on' : 'off'}
          className="practice-arena"
          aria-label={t('practice.arena')}
        >
          <div className="practice-arena-top">
            <span className="micro-label">LUMEMON / ARENA 01</span>
            <span>{modeLabel ?? t('practice.local')}</span>
          </div>
          <div className="practice-duel">
            {([0, 1] as const).map((side) => {
              const fighter = activeFighter(battle, side)
              const name = fighterName(fighter.id, locale)
              return (
                <article
                  key={side}
                  className={
                    'practice-fighter side-' + side + fighterMotion(motion ? frame : null, side)
                  }
                >
                  <p className="practice-owner">
                    {t(side === 0 ? 'practice.you' : 'practice.bot')}{' '}
                    <span>{battle.sides[side].fighters.filter((f) => f.hp > 0).length}/6</span>
                  </p>
                  <div className={fighter.hp === 0 ? 'practice-fainted' : ''}>
                    <PracticeCard id={fighter.id} priority />
                  </div>
                  <h2>{name}</h2>
                  <p className="practice-types">
                    {fighter.types.map((type) => t('pokemonTypes.' + type)).join(' / ')}
                  </p>
                  <div className="practice-hp-label">
                    <span>{t('practice.hp')}</span>
                    <strong>
                      {fighter.hp} / {fighter.maxHp}
                    </strong>
                  </div>
                  <meter
                    aria-label={t('practice.healthOf', { name })}
                    min={0}
                    max={fighter.maxHp}
                    value={fighter.hp}
                    low={fighter.maxHp * 0.25}
                    high={fighter.maxHp * 0.5}
                    optimum={fighter.maxHp}
                  />
                  <p className={'practice-status' + (fighter.status ? ' has-status' : '')}>
                    {fighter.hp === 0
                      ? t('practice.fainted')
                      : fighter.status
                        ? t('practice.status.' + fighter.status)
                        : t('practice.healthy')}
                  </p>
                  {fighter.status && (
                    <p className="practice-status-hint">
                      {t('practice.statusHint.' + fighter.status)}
                    </p>
                  )}
                  <div className="support-modifiers">
                    {fighter.barrierUntil !== null && (
                      <span>{t('supports.barrierActive', { turn: fighter.barrierUntil })}</span>
                    )}
                    {fighter.boost && (
                      <span>
                        {t('supports.boostActive', {
                          count: fighter.boost.charges,
                          turn: fighter.boost.expiresAfter,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="practice-combat-stats">
                    {t('practice.attack')} {fighter.attack} · {t('practice.defense')}{' '}
                    {fighter.defense} · {t('practice.speed')}{' '}
                    {fighter.status === 'paralysis'
                      ? Math.max(1, Math.floor(fighter.speed / 2))
                      : fighter.speed}
                  </p>
                </article>
              )
            })}
            <BattleEffects key={cueKey} frame={motion ? frame : null} />
            <span className="practice-versus" aria-hidden="true">
              VS
            </span>
          </div>
          <p className="practice-event" role="status">
            {frame?.event
              ? describe(frame.event, t, locale)
              : t(
                  playing
                    ? 'practice.motion.resolving'
                    : finished
                      ? 'practice.finishedNote'
                      : replacement
                        ? 'practice.replaceHint'
                        : 'practice.motion.ready',
                )}
          </p>
          <div className="practice-enemy-reserves">
            <span>{t('practice.rivalTeam')}</span>
            {battle.sides[1].fighters.map((f, index) => (
              <span className={f.hp === 0 ? 'is-out' : ''} key={f.id}>
                {index === battle.sides[1].active ? '◆ ' : '○ '}
                {fighterName(f.id, locale)} · {f.hp}
              </span>
            ))}
          </div>
          <OpponentSupports supports={battle.sides[1].supports} />
        </section>
        <section
          className={'practice-console' + (guide ? ' is-guided' : '')}
          aria-labelledby="practice-action-title"
        >
          {guide ?? (
            <>
              <p className="eyebrow">
                {t(
                  finished
                    ? 'practice.complete'
                    : replacement
                      ? 'practice.replacementEyebrow'
                      : 'practice.choose',
                )}
              </p>
              <h2 id="practice-action-title">
                {t(
                  finished
                    ? 'practice.finishedTitle'
                    : replacement
                      ? 'practice.replaceTitle'
                      : 'practice.actionTitle',
                )}
              </h2>
              <p className="practice-note">
                {t(
                  finished
                    ? 'practice.finishedNote'
                    : replacement
                      ? 'practice.replaceHint'
                      : 'practice.botLocked',
                )}
              </p>
            </>
          )}
          {playing && (
            <div className="practice-playback-controls">
              <p>{t('practice.motion.resolving')}</p>
              <Button variant="secondary" onClick={onSkip}>
                {t('practice.motion.skip')}
              </Button>
            </div>
          )}
          {!playing && !finished && !replacement && (
            <>
              <div className="practice-moves">
                {player.moves.map((move) => {
                  const readyOn = player.readyOn[move.id] ?? 1
                  const cooling = readyOn > battle.turn
                  const chosen = selected?.kind === 'move' && selected.moveId === move.id
                  return (
                    <button
                      type="button"
                      className="practice-move"
                      key={move.id}
                      disabled={
                        cooling || !permits({ kind: 'move', actorId: player.id, moveId: move.id })
                      }
                      aria-pressed={chosen}
                      onClick={() =>
                        onSelect({ kind: 'move', actorId: player.id, moveId: move.id })
                      }
                    >
                      <span>
                        <strong>{moveName(move.id, locale)}</strong>
                        <small>{t('pokemonTypes.' + move.type)}</small>
                      </span>
                      <span className="practice-move-detail">
                        {move.kind === 'damage'
                          ? t('practice.moveDamage', {
                              power: move.power,
                              factor: getTypeEffectiveness(move.type, enemy.types),
                            })
                          : t('practice.moveStatus', {
                              status: t('practice.status.' + move.status),
                            })}
                      </span>
                      <small>
                        {cooling
                          ? t('practice.readyOn', { turn: readyOn })
                          : move.cooldown
                            ? t('practice.cooldown', { count: move.cooldown })
                            : t('practice.noCooldown')}
                      </small>
                    </button>
                  )
                })}
              </div>
              <SupportActions
                battle={battle}
                selected={selected}
                onSelect={onSelect}
                permits={permits}
              />
              <button
                type="button"
                className="practice-pass"
                disabled={!permits({ kind: 'pass' })}
                aria-pressed={selected?.kind === 'pass'}
                onClick={() => onSelect({ kind: 'pass' })}
              >
                {t('practice.pass')}
              </button>
              <p className="practice-selection" role="status">
                {selected?.kind === 'move'
                  ? t('practice.selectedMove', { name: moveName(selected.moveId, locale) })
                  : selected?.kind === 'switch'
                    ? t('practice.selectedSwitch', { name: fighterName(selected.targetId, locale) })
                    : selected?.kind === 'support'
                      ? t('supports.selected', { name: t('supports.names.' + selected.supportId) })
                      : selected?.kind === 'pass'
                        ? t('practice.selectedPass')
                        : t('practice.noneSelected')}
              </p>
              <Button
                className="practice-confirm"
                disabled={!selected || !permits(selected)}
                onClick={onConfirm}
              >
                {t('practice.confirm')} <span aria-hidden="true">→</span>
              </Button>
            </>
          )}
          {!finished && <p className="practice-console-help">{t('practice.switchHint')}</p>}
        </section>
      </div>
      <section className="practice-bench" aria-labelledby="practice-bench-title">
        <div className="practice-section-heading">
          <h2 id="practice-bench-title">{t('practice.yourTeam')}</h2>
          <p>{t(replacement ? 'practice.replaceHint' : 'practice.benchHint')}</p>
        </div>
        <div className="practice-bench-grid">
          {battle.sides[0].fighters.map((f, index) => (
            <button
              type="button"
              key={f.id}
              disabled={
                playing ||
                finished ||
                index === battle.sides[0].active ||
                f.hp === 0 ||
                (!replacement && !permits({ kind: 'switch', actorId: player.id, targetId: f.id }))
              }
              className={
                'practice-reserve' + (index === battle.sides[0].active ? ' is-active' : '')
              }
              aria-pressed={selected?.kind === 'switch' && selected.targetId === f.id}
              onClick={() =>
                replacement
                  ? onReplace(f.id)
                  : onSelect({ kind: 'switch', actorId: player.id, targetId: f.id })
              }
            >
              <span>
                {String(index + 1).padStart(2, '0')} ·{' '}
                {index === battle.sides[0].active
                  ? t('practice.active')
                  : f.hp === 0
                    ? t('practice.fainted')
                    : t('practice.reserve')}
              </span>
              <strong>{fighterName(f.id, locale)}</strong>
              <span>
                {f.hp} / {f.maxHp} {t('practice.hp')}
                {f.status ? ' · ' + t('practice.status.' + f.status) : ''}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
