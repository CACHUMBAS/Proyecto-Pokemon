import { useCallback, useEffect, useRef, useState } from 'react'
import { BattleAudio } from '../../audio/controller'
import type { SoundCue } from '../../audio/controller'
import { BattleSynth } from '../../audio/synth'
import { AUDIO_STORAGE_KEY, DEFAULT_AUDIO, parseAudioSettings } from '../../audio/settings'
import type { AudioSettings } from '../../audio/settings'
export function useBattleAudio(scene: 'setup' | 'battle' | 'finished') {
  const [settings, setSettings] = useState(() => {
    try {
      return parseAudioSettings(localStorage.getItem(AUDIO_STORAGE_KEY))
    } catch {
      return { ...DEFAULT_AUDIO }
    }
  })
  const initialSettings = useRef(settings)
  const [enabled, setEnabled] = useState(false)
  const [issue, setIssue] = useState<'music' | 'cry' | 'unavailable' | null>(null)
  const controller = useRef<BattleAudio | null>(null)
  const mediaHost = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const engine = new BattleAudio(initialSettings.current, {
      media: (url) => {
        const audio = new Audio(url)
        audio.preload = 'none'
        audio.dataset.battleAudio = url.includes('/cries/') ? 'cry' : 'music'
        mediaHost.current?.append(audio)
        return {
          get src() {
            return audio.src
          },
          set src(value) {
            audio.src = value
          },
          get volume() {
            return audio.volume
          },
          set volume(value) {
            audio.volume = value
          },
          get loop() {
            return audio.loop
          },
          set loop(value) {
            audio.loop = value
          },
          get preload() {
            return audio.preload
          },
          set preload(value) {
            audio.preload = value as HTMLMediaElement['preload']
          },
          get onerror() {
            return audio.onerror
          },
          set onerror(value) {
            audio.onerror = value
          },
          play: () => audio.play(),
          pause: () => audio.pause(),
          removeAttribute: (name) => audio.removeAttribute(name),
          load: () => {
            audio.load()
            if (!audio.hasAttribute('src')) audio.remove()
          },
        }
      },
      effects: new BattleSynth(),
      onIssue: setIssue,
    })
    controller.current = engine
    const visibility = () => engine.setHidden(document.hidden)
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      engine.dispose()
      controller.current = null
    }
  }, [])
  useEffect(() => {
    controller.current?.setScene(scene)
  }, [scene])
  const play = useCallback((cue: SoundCue) => controller.current?.cue(cue), [])
  const stop = useCallback(() => controller.current?.stopEffects(), [])
  function toggle() {
    if (enabled) {
      controller.current?.disable()
      setEnabled(false)
    } else {
      setIssue(null)
      void controller.current?.enable()
      setEnabled(true)
    }
  }
  function configure(next: AudioSettings) {
    setSettings(next)
    setIssue(null)
    controller.current?.configure(next)
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* Playback still works without storage. */
    }
  }
  return { settings, enabled, issue, mediaHost, toggle, configure, play, stop }
}
