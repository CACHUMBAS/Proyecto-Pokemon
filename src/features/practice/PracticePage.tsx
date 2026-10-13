import { useEffect, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_PLAYER, practiceReducer } from '../../battle/practice'
import type { BattleAction } from '../../battle/engine-types'
import { PracticeSetup } from './PracticeSetup'
import { BattleBoard } from './BattleBoard'
import { BattleLog } from './BattleLog'
import { Button } from '../../components/ui/Button'
import './PracticePage.css'

export function PracticePage() {
  const { t } = useTranslation()
  const [team, setTeam] = useState<string[]>([...DEFAULT_PLAYER])
  const [session, dispatch] = useReducer(practiceReducer, null)
  const [choice, setChoice] = useState<{
    battleId: string
    version: number
    action: BattleAction
  } | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const battleId = session?.battle.battleId
  const version = session?.battle.version
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [battleId, version])
  function start() {
    setConfirmExit(false)
    dispatch({ kind: 'start', battleId: crypto.randomUUID(), playerIds: team })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  const selected =
    choice && choice.battleId === battleId && choice.version === version ? choice.action : null
  return (
    <div className="practice-page page-width">
      {!session ? (
        <PracticeSetup team={team} onTeamChange={setTeam} onStart={start} />
      ) : (
        <>
          <header className="practice-battle-heading">
            <div>
              <p className="eyebrow">{t('practice.eyebrow')}</p>
              <h1 ref={heading} tabIndex={-1}>
                {t(session.battle.phase === 'finished' ? 'practice.complete' : 'practice.turn', {
                  turn: session.battle.turn,
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
                onClick={() =>
                  dispatch({
                    kind: 'exit',
                    battleId: session.battle.battleId,
                    expectedVersion: session.battle.version,
                  })
                }
              >
                {t('practice.exit')}
              </Button>
            </div>
          )}
          <BattleBoard
            battle={session.battle}
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
          <BattleLog rounds={session.rounds} />
        </>
      )}
    </div>
  )
}
