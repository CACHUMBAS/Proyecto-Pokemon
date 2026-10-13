import { useTranslation } from 'react-i18next'
import { TRACKS } from '../../audio/settings'
import { cryPath } from '../../audio/cues'
import type { useBattleAudio } from './use-battle-audio'
interface Props {
  audio: ReturnType<typeof useBattleAudio>
  animations: boolean
  onAnimations: (value: boolean) => void
  reducedMotion: boolean
  speciesId: number
}
export function AudioControls({
  audio,
  animations,
  onAnimations,
  reducedMotion,
  speciesId,
}: Props) {
  const { t } = useTranslation()
  const { mediaHost } = audio
  return (
    <section className="practice-audio" aria-label={t('practice.audio.title')}>
      <div ref={mediaHost} hidden aria-hidden="true" />
      <button
        type="button"
        className="practice-audio-toggle"
        aria-pressed={audio.enabled}
        onClick={audio.toggle}
      >
        <span aria-hidden="true">{audio.enabled ? '♫' : '♪'}</span>
        {t(audio.enabled ? 'practice.audio.mute' : 'practice.audio.enable')}
      </button>
      <details className="practice-audio-settings">
        <summary>{t('practice.audio.settings')}</summary>
        <div className="practice-audio-fields">
          <label>
            {t('practice.audio.track')}
            <select
              value={audio.settings.track}
              onChange={(e) => audio.configure({ ...audio.settings, track: e.target.value })}
            >
              {TRACKS.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('practice.audio.music')} · {audio.settings.musicVolume}%
            <input
              type="range"
              min="0"
              max="100"
              value={audio.settings.musicVolume}
              onChange={(e) =>
                audio.configure({ ...audio.settings, musicVolume: Number(e.target.value) })
              }
            />
          </label>
          <label>
            {t('practice.audio.effects')} · {audio.settings.effectsVolume}%
            <input
              type="range"
              min="0"
              max="100"
              value={audio.settings.effectsVolume}
              onChange={(e) =>
                audio.configure({ ...audio.settings, effectsVolume: Number(e.target.value) })
              }
            />
          </label>
          <button
            type="button"
            className="practice-audio-preview"
            disabled={!audio.enabled}
            onClick={() => audio.play({ kind: 'switch', cryPath: cryPath(speciesId) })}
          >
            {t('practice.audio.preview')}
          </button>
          <label className="practice-motion-toggle">
            <input
              type="checkbox"
              checked={animations}
              disabled={reducedMotion}
              onChange={(e) => onAnimations(e.target.checked)}
            />
            {t(reducedMotion ? 'practice.audio.reduced' : 'practice.audio.animations')}
          </label>
          <p>{t('practice.audio.source')}</p>
        </div>
      </details>
      {audio.issue && (
        <p className="practice-audio-issue" role="status">
          {t('practice.audio.error.' + audio.issue)}
        </p>
      )}
    </section>
  )
}
