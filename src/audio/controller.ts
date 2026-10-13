import { TRACKS } from './settings.ts'
import type { AudioSettings } from './settings.ts'
export type SoundKind = 'attack' | 'hit' | 'immune' | 'status' | 'switch' | 'faint' | 'win' | 'lose'
export interface SoundCue {
  kind: SoundKind
  type?: string
  cryPath?: string
}
export interface MediaPort {
  src: string
  volume: number
  loop: boolean
  preload: string
  onerror: OnErrorEventHandler
  play(): Promise<void>
  pause(): void
  removeAttribute(name: string): void
  load(): void
}
export interface EffectsPort {
  resume(): Promise<void>
  play(cue: SoundCue, volume: number): void
  stop(): void
  suspend(): void
  close(): void
}
export interface AudioPorts {
  media: (url: string) => MediaPort
  effects: EffectsPort
  onIssue: (issue: 'music' | 'cry' | 'unavailable') => void
}
export class BattleAudio {
  private settings: AudioSettings
  private ports: AudioPorts
  private enabled = false
  private hidden = false
  private disposed = false
  private scene: 'setup' | 'battle' | 'finished' = 'setup'
  private music: MediaPort | null = null
  private cry: MediaPort | null = null
  private musicRevision = 0
  constructor(settings: AudioSettings, ports: AudioPorts) {
    this.settings = { ...settings }
    this.ports = ports
  }
  private get audible() {
    return this.enabled && !this.hidden && !this.disposed
  }
  private get musicAllowed() {
    return this.audible && this.scene !== 'finished' && this.settings.musicVolume > 0
  }
  private release(media: MediaPort | null) {
    if (!media) return
    media.onerror = null
    media.pause()
    media.removeAttribute('src')
    media.load()
  }
  private async syncMusic(): Promise<void> {
    const revision = ++this.musicRevision
    if (!this.musicAllowed) {
      this.music?.pause()
      return
    }
    try {
      if (!this.music) {
        this.music = this.ports.media(TRACKS.find((t) => t.id === this.settings.track)!.src)
        this.music.loop = true
        this.music.preload = 'none'
        const current = this.music
        current.onerror = () => {
          if (this.audible && this.music === current) this.ports.onIssue('music')
        }
      }
      const current = this.music
      current.volume = this.settings.musicVolume / 100
      await current.play()
      if (!this.musicAllowed || this.music !== current) current.pause()
    } catch {
      if (revision === this.musicRevision && this.audible) this.ports.onIssue('music')
    }
  }
  async enable(): Promise<void> {
    if (this.disposed) return
    this.enabled = true
    const music = this.syncMusic()
    try {
      await this.ports.effects.resume()
    } catch {
      if (this.audible) this.ports.onIssue('unavailable')
    }
    await music
    if (!this.audible) this.ports.effects.suspend()
  }
  disable(): void {
    this.enabled = false
    void this.syncMusic()
    this.stopEffects()
    this.ports.effects.suspend()
  }
  configure(settings: AudioSettings): void {
    if (this.disposed) return
    if (settings.track !== this.settings.track) {
      this.release(this.music)
      this.music = null
    }
    if (settings.effectsVolume !== this.settings.effectsVolume) this.stopEffects()
    this.settings = { ...settings }
    void this.syncMusic()
  }
  setHidden(hidden: boolean): void {
    this.hidden = hidden
    if (hidden) {
      void this.syncMusic()
      this.stopEffects()
      this.ports.effects.suspend()
    } else if (this.enabled && !this.disposed) void this.enable()
  }
  setScene(scene: 'setup' | 'battle' | 'finished'): void {
    if (this.scene === scene) return
    this.scene = scene
    void this.syncMusic()
  }
  cue(cue: SoundCue): void {
    this.stopEffects()
    if (!this.audible || this.settings.effectsVolume === 0) return
    try {
      this.ports.effects.play(cue, this.settings.effectsVolume / 100)
    } catch {
      this.ports.onIssue('unavailable')
    }
    if (!cue.cryPath) return
    try {
      const current = this.ports.media(cue.cryPath)
      this.cry = current
      current.volume = this.settings.effectsVolume / 100
      current.onerror = () => {
        if (this.audible && this.cry === current) this.ports.onIssue('cry')
      }
      void current
        .play()
        .then(() => {
          if (!this.audible || this.cry !== current) current.pause()
        })
        .catch(() => {
          if (this.audible && this.cry === current) this.ports.onIssue('cry')
        })
    } catch {
      this.ports.onIssue('cry')
    }
  }
  stopEffects(): void {
    this.ports.effects.stop()
    this.release(this.cry)
    this.cry = null
  }
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.enabled = false
    this.musicRevision++
    this.stopEffects()
    this.release(this.music)
    this.music = null
    this.ports.effects.close()
  }
}
