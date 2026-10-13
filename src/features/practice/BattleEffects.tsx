import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlaybackFrame } from '../../battle/playback'
const colors: Record<string, string> = {
  fire: '#ff9970',
  water: '#6ad9ff',
  grass: '#9aec9b',
  electric: '#ffe781',
  psychic: '#e9a2ff',
  ghost: '#c2adff',
  fighting: '#ffb390',
  rock: '#ddc49f',
  ground: '#e0b480',
  ice: '#aeedff',
  poison: '#cc9cfa',
  fairy: '#ffbedd',
  normal: '#d4e6ee',
  bug: '#cde982',
  flying: '#b8d9ff',
  steel: '#cbd6e1',
  dragon: '#a8a1ff',
  dark: '#b9b1d6',
}
export function BattleEffects({ frame }: { frame: PlaybackFrame | null }) {
  const { t } = useTranslation()
  const event = frame?.event
  if (!event) return null
  const style = {
    '--effect-color': colors[frame.type ?? 'normal'] ?? colors.normal,
  } as CSSProperties
  if (event.kind === 'move')
    return (
      <div
        className={'battle-projectile from-' + event.side + ' effect-' + frame.type}
        style={style}
        aria-hidden="true"
      >
        <i />
        <i />
        <i />
      </div>
    )
  if (event.kind === 'damage')
    return (
      <div
        className={'battle-damage target-' + event.side + (event.amount === 0 ? ' is-immune' : '')}
        aria-hidden="true"
      >
        {event.amount === 0 ? t('practice.motion.immune') : '−' + event.amount}
      </div>
    )
  if (event.kind === 'status' && event.outcome === 'applied')
    return (
      <div className={'battle-condition target-' + event.side} style={style} aria-hidden="true">
        ◎
      </div>
    )
  return null
}
