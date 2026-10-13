import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_PLAYER } from '../../battle/practice'
import { activeFighter } from '../../battle/battle-state'
import { cryPath, frameCue } from '../../audio/cues'
import type { BattleAction } from '../../battle/engine-types'
import { PracticeSetup } from './PracticeSetup'
import { BattleBoard } from './BattleBoard'
import { BattleLog } from './BattleLog'
import { AudioControls } from './AudioControls'
import { useBattlePlayback } from './use-battle-playback'
import { useBattleAudio } from './use-battle-audio'
import { Button } from '../../components/ui/Button'
import './PracticePage.css'
import './BattleEffects.css'
export function PracticePage() {
  const { t } = useTranslation()
  const [team, setTeam] = useState<string[]>([...DEFAULT_PLAYER])
  const playback = useBattlePlayback()
  const { presentation, dispatch, frame, playing, skip } = playback
  const session = presentation.session
  const battle = frame?.battle ?? session?.battle
  const audio = useBattleAudio(
    !battle
      ? 'setup'
      : battle.phase === 'finished' || frame?.event?.kind === 'result'
        ? 'finished'
        : 'battle',
  )
  const { play, stop } = audio
  const [choice, setChoice] = useState<{
    battleId: string
    version: number
    action: BattleAction
  } | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const battleId = session?.battle.battleId,
    version = session?.battle.version
  const initialSpecies = battle ? activeFighter(battle, 0).speciesId : 25
  // This effect only owns entry audio; changing turns must not replay the lead's cry.
  useEffect(() => {
    if (battleId) play({ kind: 'switch', cryPath: cryPath(initialSpecies) })
    return stop
    // initialSpecies is deliberately captured only when a different match starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battleId, play, stop])
  useEffect(() => {
    if (frame && playback.animations) {
      const cue = frameCue(frame)
      if (cue) play(cue)
    }
    return stop
  }, [frame, playback.animations, play, stop])
  useEffect(() => {
    if (!playing) heading.current?.focus({ preventScroll: true })
  }, [battleId, version, playing])
  function start() {
    audio.stop()
    setConfirmExit(false)
    dispatch({ kind: 'start', battleId: crypto.randomUUID(), playerIds: team })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const selected =
    choice && choice.battleId === battleId && choice.version === version ? choice.action : null
  return (
    <div className="practice-page page-width">
      <AudioControls
        audio={audio}
        animations={playback.animations}
        onAnimations={playback.setAnimations}
        reducedMotion={playback.reducedMotion}
        speciesId={initialSpecies}
      />
      {!session || !battle ? (
        <PracticeSetup team={team} onTeamChange={setTeam} onStart={start} />
      ) : (
        <>
          <header className="practice-battle-heading">
            <div>
              <p className="eyebrow">{t('practice.eyebrow')}</p>
              <h1 ref={heading} tabIndex={-1}>
                {t(battle.phase === 'finished' ? 'practice.complete' : 'practice.turn', {
                  turn: battle.turn,
                })}
              </h1>
            </div>
            <button
              type="button"
              className="practice-text-button"
              onClick={() => setConfirmExit(true)}
            >
              {t('practice.changeTeam')} ↗
            </button>
          </header>
          <p className="practice-local-notice">{t('practice.localNotice')}</p>
          {confirmExit && (
            <div className="practice-exit" role="alert">
              <p>{t('practice.exitConfirm')}</p>
              <Button variant="secondary" onClick={() => setConfirmExit(false)}>
                {t('practice.keepPlaying')}
              </Button>
              <Button
                onClick={() => {
                  audio.stop()
                  dispatch({
                    kind: 'exit',
                    battleId: session.battle.battleId,
                    expectedVersion: session.battle.version,
                  })
                }}
              >
                {t('practice.exit')}
              </Button>
            </div>
          )}
          <BattleBoard
            battle={battle}
            frame={frame}
            playing={playing}
            cueKey={battleId + ':' + version + ':' + presentation.cursor}
            onSkip={() => {
              audio.stop()
              skip()
            }}
            selected={selected}
            onSelect={(action) =>
              setChoice({
                battleId: session.battle.battleId,
                version: session.battle.version,
                action,
              })
            }
            onConfirm={() => {
              if (selected)
                dispatch({
                  kind: 'turn',
                  battleId: session.battle.battleId,
                  expectedVersion: session.battle.version,
                  action: selected,
                  tieBreak: (crypto.getRandomValues(new Uint8Array(1))[0] & 1) as 0 | 1,
                })
            }}
            onReplace={(targetId) =>
              dispatch({
                kind: 'replace',
                battleId: session.battle.battleId,
                expectedVersion: session.battle.version,
                targetId,
              })
            }
            onRematch={start}
          />
          <BattleLog rounds={playing ? presentation.previousRounds : session.rounds} />
        </>
      )}
    </div>
  )
}
