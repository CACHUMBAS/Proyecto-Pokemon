import { useTranslation } from 'react-i18next'
import type { SupportDefinition } from '../../battle/engine-types'
import './SupportCards.css'

/** Public inventory only; never reveals the bot's pending action. */
export function OpponentSupports({
  supports,
}: {
  supports: readonly (SupportDefinition & { used?: boolean })[]
}) {
  const { t } = useTranslation()
  return (
    <section className="opponent-supports" aria-label={t('supports.opponentTitle')}>
      <h3>{t('supports.opponentTitle')}</h3>
      {supports.length === 0 ? (
        <p>{t('supports.opponentNone')}</p>
      ) : (
        <ul>
          {supports.map((s) => (
            <li key={s.id} className={s.used ? 'is-spent' : ''}>
              <strong>{t('supports.names.' + s.id)}</strong>
              <span>
                {t('supports.effects.' + s.effect)} ·{' '}
                {t(s.used ? 'supports.availability.used' : 'supports.unspent')}
              </span>
              <small>{s.id}</small>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
