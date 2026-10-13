export const TRACKS = [
  {
    id: 'hgss',
    src: 'https://play.pokemonshowdown.com/audio/hgss-johto-trainer.mp3',
    label: 'HeartGold / SoulSilver',
  },
  {
    id: 'dpp',
    src: 'https://play.pokemonshowdown.com/audio/dpp-trainer.mp3',
    label: 'Diamond / Pearl',
  },
  {
    id: 'bw',
    src: 'https://play.pokemonshowdown.com/audio/bw-trainer.mp3',
    label: 'Black / White',
  },
  {
    id: 'oras',
    src: 'https://play.pokemonshowdown.com/audio/oras-trainer.mp3',
    label: 'Omega Ruby / Alpha Sapphire',
  },
] as const
export interface AudioSettings {
  musicVolume: number
  effectsVolume: number
  track: string
}
export const DEFAULT_AUDIO: AudioSettings = { musicVolume: 25, effectsVolume: 65, track: 'hgss' }
export function parseAudioSettings(raw: string | null): AudioSettings {
  try {
    const data = JSON.parse(raw ?? 'null')
    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      [data.musicVolume, data.effectsVolume].every(
        (n) => Number.isFinite(n) && n >= 0 && n <= 100,
      ) &&
      TRACKS.some((t) => t.id === data.track)
    )
      return { musicVolume: data.musicVolume, effectsVolume: data.effectsVolume, track: data.track }
  } catch {
    /* Storage is optional. */
  }
  return { ...DEFAULT_AUDIO }
}
export const AUDIO_STORAGE_KEY = 'lumemon.audio.v1'
