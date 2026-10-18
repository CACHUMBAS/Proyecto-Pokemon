import { useTranslation } from 'react-i18next'
import type { CardRecord } from '../../catalog/types'
import { getTeamBattleDetails } from '../../battle/team-catalog'
import './TeamBattleDetails.css'

export function TeamBattleDetails({ card, name }: { card: CardRecord; name: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage === 'en' ? 'en' : 'es'
  const details = getTeamBattleDetails(card)
  if (!details) return <p className="team-battle-unavailable">{t('team.battleUnavailable')}</p>
  return (
    <div
      className="team-battle-details"
      role="group"
      aria-label={t('team.battleLabel', { name, id: card.id })}
    >
      <p className="team-battle-title">{t('team.battleTitle')}</p>
      <p className="team-battle-types">
        {details.types.map((type) => t('pokemonTypes.' + type)).join(' / ')}
      </p>
      <dl className="team-battle-stats">
        {(
          [
            ['hp', details.stats.maxHp],
            ['attack', details.stats.attack],
            ['defense', details.stats.defense],
            ['speed', details.stats.speed],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt>{t('practice.' + label)}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <details className="team-battle-moves">
        <summary aria-label={t('team.battleMovesLabel', { name, id: card.id })}>
          {t('team.battleMoves', { count: details.moves.length })}
        </summary>
        <p className="team-battle-hint">{t('team.battleHint')}</p>
        <ul>
          {details.moves.map((move) => (
            <li key={move.id}>
              <strong>{move.names[locale]}</strong>
              <span className="team-battle-move-type">{t('pokemonTypes.' + move.type)}</span>
              <span>
                {move.kind === 'damage'
                  ? t('team.battlePower', { power: move.power })
                  : t('practice.moveStatus', { status: t('practice.status.' + move.status) })}
              </span>
              <span>
                {t(move.cooldown ? 'practice.cooldown' : 'practice.noCooldown', {
                  count: move.cooldown,
                })}
              </span>
              {move.kind === 'status' && (
                <p className="team-battle-status">{t('practice.statusHint.' + move.status)}</p>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
