import { useTranslation } from 'react-i18next'
import { activeFighter } from '../../battle/battle-state'
import { supportUnavailable } from '../../battle/supports'
import type { BattleAction, BattleState } from '../../battle/engine-types'

export function SupportActions({
  battle,
  selected,
  onSelect,
  permits,
}: {
  battle: BattleState
  selected: BattleAction | null
  onSelect: (action: BattleAction) => void
  permits: (action: BattleAction) => boolean
}) {
  const { t } = useTranslation()
  const supports = battle.sides[0].supports
  if (!supports.length) return null
  const actorId = activeFighter(battle, 0).id
  return (
    <section className="support-actions" aria-label={t('supports.title')}>
      <h3>{t('supports.title')}</h3>
      <p className="practice-note">{t('supports.turnCost')}</p>
      {supports.map((s) => {
        const reason = supportUnavailable(battle, 0, s.id)
        const action: BattleAction = { kind: 'support', actorId, supportId: s.id }
        return (
          <button
            type="button"
            className="practice-move"
            key={s.id}
            disabled={reason !== null || !permits(action)}
            aria-pressed={selected?.kind === 'support' && selected.supportId === s.id}
            onClick={() => onSelect(action)}
          >
            <strong>{t('supports.names.' + s.id)}</strong>
            <small>{t('supports.descriptions.' + s.effect)}</small>
            <span className="support-availability">
              {t('supports.availability.' + (reason ?? 'ready'))}
            </span>
          </button>
        )
      })}
    </section>
  )
}
