import { useTranslation } from 'react-i18next'
import { listPlayableSupports } from '../../battle/supports'
import { PracticeCard } from './PracticeCard'
import './SupportCards.css'

const supports = listPlayableSupports()
export function SupportPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  return (
    <section className="support-picker" aria-labelledby="support-title">
      <div className="practice-section-heading">
        <div>
          <p className="eyebrow">{t('supports.eyebrow')}</p>
          <h2 id="support-title">{t('supports.title')}</h2>
        </div>
        <p role="status">{t('supports.count', { count: selected.length })}</p>
      </div>
      <p className="practice-note">{t('supports.rules')}</p>
      <p className="practice-note">{t('supports.scope')}</p>
      <div className="support-grid">
        {supports.map((s) => {
          const chosen = selected.includes(s.id)
          return (
            <article key={s.id} className={'support-card' + (chosen ? ' is-selected' : '')}>
              <PracticeCard id={s.id} />
              <h3>{t('supports.names.' + s.id)}</h3>
              <p className="support-effect">{t('supports.effects.' + s.effect)}</p>
              <p className="practice-note">{t('supports.descriptions.' + s.effect)}</p>
              <button
                type="button"
                className="practice-move"
                aria-pressed={chosen}
                disabled={!chosen && selected.length === 3}
                onClick={() =>
                  onChange(chosen ? selected.filter((id) => id !== s.id) : [...selected, s.id])
                }
              >
                {t(chosen ? 'supports.remove' : 'supports.add', {
                  name: t('supports.names.' + s.id),
                })}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
