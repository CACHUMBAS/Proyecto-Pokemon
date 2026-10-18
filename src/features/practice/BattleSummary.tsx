import { useTranslation } from 'react-i18next'
import { summarizeBattle } from '../../battle/summary'
import type { SideSummary } from '../../battle/summary'
import type { PracticeSession } from '../../battle/practice'
import './BattleSummary.css'

const metrics: readonly (keyof SideSummary)[] = [
  'attackDamage',
  'statusDamageTaken',
  'healed',
  'supportsUsed',
  'fainted',
]

export function BattleSummary({ session }: { session: PracticeSession }) {
  const { t, i18n } = useTranslation()
  const summary = summarizeBattle(session)
  if (!summary) return null
  return (
    <section className="battle-summary" aria-labelledby="battle-summary-title">
      <header>
        <div>
          <p className="eyebrow">{t('battleSummary.eyebrow')}</p>
          <h2 id="battle-summary-title">{t('battleSummary.title')}</h2>
        </div>
        <p className="battle-summary-turns">{t('battleSummary.turns', { count: summary.turns })}</p>
      </header>
      <table aria-label={t('battleSummary.comparison')} aria-describedby="battle-summary-note">
        <thead>
          <tr>
            <th scope="col">{t('battleSummary.metric')}</th>
            <th scope="col">{t('battleSummary.you')}</th>
            <th scope="col">{t('opponents.' + session.opponentId + '.name')}</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric}>
              <th scope="row">{t('battleSummary.' + metric)}</th>
              {summary.sides.map((side, index) => (
                <td key={index}>{side[metric].toLocaleString(i18n.resolvedLanguage)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p id="battle-summary-note" className="battle-summary-note">
        {t('battleSummary.note')}
      </p>
    </section>
  )
}
