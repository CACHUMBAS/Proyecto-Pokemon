import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { accountClient, accountStore } from '../../account/client'
import { createOnlineGateway, battleStorage } from '../../online-battle/gateway'
import { createOnlineStore } from '../../online-battle/store'
import type { BattleAction } from '../../battle/engine-types'
import { activeFighter } from '../../battle/battle-state'
import { frameCue } from '../../audio/cues'
import { BattleBoard } from '../practice/BattleBoard'
import { BattleLog } from '../practice/BattleLog'
import { BattleSummary } from '../practice/BattleSummary'
import { AudioControls } from '../practice/AudioControls'
import { useBattleAudio } from '../practice/use-battle-audio'
import { useOnlinePlayback } from './use-online-playback'
import { OnlineTeam } from './OnlineTeam'
import { Button } from '../../components/ui/Button'
import '../practice/PracticePage.css'
import '../practice/BattleEffects.css'
import '../collection/CollectionPage.css'
import './OnlineBattlePage.css'
function AbandonDialog({ cancel, confirm }: { cancel: () => void; confirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null),
    { t } = useTranslation()
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="online-dialog"
      onCancel={cancel}
      onClose={cancel}
      aria-labelledby="abandon-title"
    >
      <h2 id="abandon-title">{t('online.abandonTitle')}</h2>
      <p>{t('online.abandonHelp')}</p>
      <div className="online-actions">
        <Button variant="secondary" onClick={cancel}>
          {t('practice.keepPlaying')}
        </Button>
        <Button onClick={confirm}>{t('online.abandon')}</Button>
      </div>
    </dialog>
  )
}
function PlayerBattle({ userId }: { userId: string }) {
  const [store] = useState(() =>
    createOnlineStore(createOnlineGateway(accountClient!, userId), battleStorage(userId)),
  )
  return <OnlineBattleScreen store={store} />
}
export function OnlineBattleScreen({ store }: { store: ReturnType<typeof createOnlineStore> }) {
  const { t } = useTranslation()
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => store.start(), [store])
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === 'visible') void store.refresh()
    }
    document.addEventListener('visibilitychange', visible)
    return () => document.removeEventListener('visibilitychange', visible)
  }, [store])
  const [hiddenMatch, setHiddenMatch] = useState<string | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const [choice, setChoice] = useState<{
    id: string
    revision: number
    action: BattleAction
  } | null>(null)
  const match = state.data?.match ?? null,
    show = match && match.status !== 'abandoned' && hiddenMatch !== match.id ? match : null
  const playback = useOnlinePlayback(show),
    battle = playback.frame?.battle ?? show?.session.battle
  const audio = useBattleAudio(
    !battle
      ? 'setup'
      : battle.phase === 'finished' || playback.frame?.event?.kind === 'result'
        ? 'finished'
        : 'battle',
  )
  const { play, stopTransient } = audio
  useEffect(() => {
    if (playback.frame) {
      const cue = frameCue(playback.frame)
      if (cue) play(cue)
    }
    return stopTransient
  }, [playback.frame, play, stopTransient])
  const busy =
    state.busy || !!state.pending || playback.playing || state.status !== 'ready' || !!state.error
  const selected =
    choice && show && choice.id === show.id && choice.revision === show.revision
      ? choice.action
      : null
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!playback.playing) heading.current?.focus({ preventScroll: true })
  }, [show?.id, show?.revision, playback.playing])
  const commandBase = show ? { battleId: show.id, expectedRevision: show.revision } : null
  return (
    <>
      <AudioControls
        audio={audio}
        animations={playback.animations}
        onAnimations={playback.setAnimations}
        reducedMotion={playback.reducedMotion}
        speciesId={battle ? activeFighter(battle, 0).speciesId : 25}
      />
      <div className="online-toolbar">
        {state.data && (
          <p className="online-wallet">
            <span>{t('collection.wallet.coins')}</span>
            <strong>{state.data.coins.toLocaleString()}</strong>
          </p>
        )}
        <Link className="button button-secondary" to="/sobres">
          {t('online.packs')}
        </Link>
        <button
          className="practice-text-button"
          disabled={state.busy || playback.playing}
          onClick={() => void store.refresh()}
        >
          {t('online.refresh')}
        </button>
      </div>
      <div className="online-status" aria-busy={state.busy}>
        {(state.busy || state.status === 'loading') && <p role="status">{t('online.saving')}</p>}
        {state.error && <p role="alert">{t('online.errors.' + state.error)}</p>}
        {state.pending && !state.busy && (
          <Button onClick={() => void store.retry()}>{t('online.retry')}</Button>
        )}
      </div>
      {show && battle ? (
        <section>
          <header className="practice-battle-heading">
            <div>
              <p className="eyebrow">{t('online.saved')}</p>
              <h2 ref={heading} tabIndex={-1}>
                {t(battle.phase === 'finished' ? 'practice.complete' : 'practice.turn', {
                  turn: battle.turn,
                })}
              </h2>
              <p>{t('online.opponent')}</p>
            </div>
            {show.status === 'active' && (
              <button
                className="practice-text-button"
                disabled={state.busy || !!state.pending || playback.playing}
                onClick={() => setConfirmExit(true)}
              >
                {t('online.abandon')}
              </button>
            )}
          </header>
          {!playback.playing && show.status === 'finished' && (
            <>
              <p className="online-reward" role="status">
                {t(show.reward === 50 ? 'online.reward' : 'online.noReward')}
              </p>
              <BattleSummary session={{ ...show.session, tutorial: null, botAction: null }} />
            </>
          )}
          <BattleBoard
            battle={battle}
            frame={playback.frame}
            motion={playback.animations}
            playing={busy}
            modeLabel={t('online.saved')}
            finishedNote={t(show.reward === 50 ? 'online.reward' : 'online.noReward')}
            cueKey={show.id + ':' + show.revision + ':' + playback.view.cursor}
            onSkip={() => {
              audio.stop()
              playback.skip()
            }}
            selected={selected}
            onSelect={(action) => setChoice({ id: show.id, revision: show.revision, action })}
            onConfirm={() => {
              if (selected && commandBase && !busy)
                void store.submit({ ...commandBase, kind: 'turn', action: selected })
            }}
            onReplace={(targetId) => {
              if (commandBase && !busy)
                void store.submit({ ...commandBase, kind: 'replace', targetId })
            }}
            onRematch={() => {
              audio.stop()
              setHiddenMatch(show.id)
            }}
          />
          <BattleLog
            rounds={playback.playing ? playback.view.previousRounds : show.session.rounds}
          />
        </section>
      ) : state.data ? (
        <section>
          {match?.status === 'abandoned' && <p role="status">{t('online.abandoned')}</p>}
          {state.data.owned.length >= 6 ? (
            <OnlineTeam
              key={match?.id ?? 'first'}
              owned={state.data.owned.map((c) => c.card_id)}
              disabled={busy}
              start={(cardIds) => void store.submit({ kind: 'start', cardIds })}
            />
          ) : (
            <div className="collection-notice">
              <p>{t('online.needStarter')}</p>
              <Link className="button button-primary" to="/coleccion">
                {t('nav.collection')}
              </Link>
            </div>
          )}
        </section>
      ) : null}
      {confirmExit && show && (
        <AbandonDialog
          cancel={() => setConfirmExit(false)}
          confirm={() => {
            setConfirmExit(false)
            audio.stop()
            void store.submit({
              kind: 'abandon',
              battleId: show.id,
              expectedRevision: show.revision,
            })
          }}
        />
      )}
    </>
  )
}
function ConnectedBattle() {
  const { t } = useTranslation(),
    store = accountStore!
  const account = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => store.start(), [store])
  if (account.status === 'loading') return <p role="status">{t('account.loading')}</p>
  if (account.status === 'error')
    return (
      <div className="collection-notice">
        <p role="alert">{t('account.loadError')}</p>
        <Button onClick={() => void store.refresh()}>{t('account.retry')}</Button>
      </div>
    )
  if (!account.user)
    return (
      <div className="collection-guest">
        <h2>{t('online.loginTitle')}</h2>
        <p>{t('online.loginHelp')}</p>
        <Link className="button button-primary" to="/cuenta">
          {t('collection.guest.login')}
        </Link>
      </div>
    )
  return <PlayerBattle key={account.user.id} userId={account.user.id} />
}
export function OnlineBattlePage() {
  const { t } = useTranslation()
  return (
    <div className="practice-page online-page page-width">
      <header className="online-hero">
        <span className="eyebrow">{t('online.eyebrow')}</span>
        <h1>{t('online.title')}</h1>
        <p>{t('online.intro')}</p>
        <div className="online-rules">
          <span>{t('online.ruleTeam')}</span>
          <span>{t('online.ruleReward')}</span>
          <span>{t('online.ruleResume')}</span>
        </div>
        <Link to="/practica">{t('online.practice')} ↗</Link>
      </header>
      {accountStore ? (
        <ConnectedBattle />
      ) : (
        <p className="collection-notice" role="status">
          {t('online.errors.unavailable')}
        </p>
      )}
    </div>
  )
}
