import { type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PrismMark } from '../../components/ui/PrismMark'
export function PrismaPack({ size = 3 }: { size?: number }) {
  const { t } = useTranslation()
  function reflect(event: PointerEvent<HTMLDivElement>) {
    if (
      event.pointerType !== 'mouse' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const box = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty(
      '--foil-x',
      ((event.clientX - box.left) / box.width) * 100 + '%',
    )
  }
  return (
    <div
      className="prisma-pack"
      aria-hidden="true"
      onPointerMove={reflect}
      onPointerLeave={(event) => event.currentTarget.style.removeProperty('--foil-x')}
    >
      <div className="prisma-pack-seal" />
      <div className="prisma-pack-inner">
        <span className="prisma-pack-brand">
          LUMEMON <span>✦</span>
        </span>
        <div className="prisma-pack-orbit">
          <i />
          <i />
          <i />
          <PrismMark />
        </div>
        <span className="prisma-pack-series">CARD UNIVERSE / 001</span>
        <strong>PRISMA</strong>
        <span className="prisma-pack-caption">{t('collection.design.packSubtitle')}</span>
        <span className="prisma-pack-count">
          {t('collection.design.cardCount', { count: size })}
          <b>✦</b>
        </span>
      </div>
      <div className="prisma-pack-seal prisma-pack-bottom" />
    </div>
  )
}
