import { useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { CardPreview } from '../../types/card-preview'
import { PrismMark } from '../ui/PrismMark'
import './PokemonCard.css'

interface Props {
  card: CardPreview
  onSelect?: (id: string) => void
  priority?: boolean
}

function moveReflection(event: PointerEvent<HTMLElement>) {
  if (
    event.pointerType !== 'mouse' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )
    return
  const element = event.currentTarget
  const bounds = element.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
  const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))
  element.style.setProperty('--rotate-x', `${(0.5 - y) * 9}deg`)
  element.style.setProperty('--rotate-y', `${(x - 0.5) * 9}deg`)
  element.style.setProperty('--shine-x', `${x * 100}%`)
  element.style.setProperty('--shine-y', `${y * 100}%`)
}

function resetReflection(event: PointerEvent<HTMLElement>) {
  for (const property of ['--rotate-x', '--rotate-y', '--shine-x', '--shine-y'])
    event.currentTarget.style.removeProperty(property)
}

export function PokemonCard({ card, onSelect, priority = false }: Props) {
  const { t } = useTranslation()
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const name =
    card.origin === 'pokeprisma' && card.presentation !== 'prisma' ? t(card.name) : card.name
  const missing = !card.imageUrl || failedUrl === card.imageUrl
  const contents = (
    <>
      {missing ? (
        <span className="card-fallback">
          <span className="fallback-orbit" aria-hidden="true" />
          <PrismMark />
          <span className="fallback-title">{name}</span>
          <span className="fallback-note">{t('common.missing')}</span>
        </span>
      ) : (
        <img
          src={card.imageUrl!}
          alt={name}
          width="600"
          height="825"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setFailedUrl(card.imageUrl)}
        />
      )}
      {card.presentation === 'prisma' && !missing && (
        <span className="prisma-card-label">
          <strong>{name}</strong>
          <small>{t('catalog.customCard')}</small>
        </span>
      )}
      <span className="card-foil" aria-hidden="true" />
      <span className="card-glint" aria-hidden="true" />
    </>
  )
  const shared = {
    className: `pokemon-card${missing ? ' pokemon-card-missing' : ''}${card.presentation === 'prisma' ? ' pokemon-card-prisma' : ''}`,
    onPointerMove: moveReflection,
    onPointerLeave: resetReflection,
  }
  return onSelect ? (
    <button
      {...shared}
      type="button"
      aria-label={t('common.details', { name })}
      onClick={() => onSelect(card.id)}
    >
      {contents}
    </button>
  ) : (
    <div {...shared}>{contents}</div>
  )
}
