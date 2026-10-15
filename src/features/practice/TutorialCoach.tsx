import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { PracticeSession } from '../../battle/practice'
import type { TutorialStep } from '../../battle/tutorial'
import { activeFighter } from '../../battle/battle-state'
import { getTypeEffectiveness } from '../../battle/type-chart'
import { Button } from '../../components/ui/Button'
import './TutorialCoach.css'
const steps: TutorialStep[] = ['welcome', 'attack', 'types', 'switch', 'status']
const preceding: Partial<Record<TutorialStep, TutorialStep>> = {
  types: 'attack',
  status: 'switch',
  complete: 'status',
}
interface Props {
  session: PracticeSession
  busy: boolean
  onNext: () => void
  onDismiss: () => void
}
export function TutorialCoach({ session, busy, onNext, onDismiss }: Props) {
  const { t } = useTranslation()
  const heading = useRef<HTMLHeadingElement>(null)
  const stage = session.tutorial!
  const shown = busy ? (preceding[stage] ?? stage) : stage
  const index = shown === 'complete' ? 5 : steps.indexOf(shown)
  useEffect(() => {
    if (!busy) {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    }
  }, [stage, busy])
  const enemy = activeFighter(session.battle, 1)
  return (
    <div className={'tutorial-coach' + (shown === 'complete' ? ' is-complete' : '')}>
      <div className="tutorial-coach-top">
        <span className="eyebrow">{t('tutorial.label')}</span>
        <span>
          {shown === 'complete' ? '✓' : t('tutorial.progress', { step: index + 1, total: 5 })}
        </span>
      </div>
      <div className="tutorial-progress" aria-hidden="true">
        {steps.map((step, i) => (
          <span key={step} className={i <= index ? 'is-done' : ''} />
        ))}
      </div>
      <h2 id="practice-action-title" ref={heading} tabIndex={-1}>
        {t(busy ? 'tutorial.observing' : 'tutorial.steps.' + shown + '.title')}
      </h2>
      <p className="tutorial-description">
        {t(busy ? 'tutorial.observingHint' : 'tutorial.steps.' + shown + '.body')}
      </p>
      {!busy && shown === 'types' && (
        <div className="tutorial-type-table">
          <div>
            <span>
              {t('pokemonTypes.electric')} →{' '}
              {enemy.types.map((type) => t('pokemonTypes.' + type)).join(' / ')}
            </span>
            <strong>×{getTypeEffectiveness('electric', enemy.types)}</strong>
          </div>
          <div>
            <span>
              {t('pokemonTypes.water')} → {t('pokemonTypes.fire')}
            </span>
            <strong>×{getTypeEffectiveness('water', ['fire'])}</strong>
          </div>
          <div>
            <span>
              {t('pokemonTypes.electric')} → {t('pokemonTypes.ground')}
            </span>
            <strong>×{getTypeEffectiveness('electric', ['ground'])}</strong>
          </div>
        </div>
      )}
      {!busy && shown === 'switch' && (
        <a className="tutorial-reserves-link" href="#practice-bench-title">
          {t('tutorial.viewReserves')} ↓
        </a>
      )}
      {!busy && (shown === 'attack' || shown === 'switch' || shown === 'status') && (
        <p className="tutorial-instruction">{t('tutorial.steps.' + shown + '.action')}</p>
      )}
      <div className="tutorial-actions">
        {!busy && (shown === 'welcome' || shown === 'types') && (
          <Button onClick={onNext}>
            {t(shown === 'welcome' ? 'tutorial.begin' : 'tutorial.understood')}
          </Button>
        )}
        {!busy && shown === 'complete' && (
          <Button onClick={onDismiss}>{t('tutorial.continue')}</Button>
        )}
        {shown !== 'complete' && (
          <button
            type="button"
            className="practice-text-button"
            disabled={busy}
            onClick={onDismiss}
          >
            {t('tutorial.dismiss')}
          </button>
        )}
      </div>
      {!busy && shown === 'complete' && (
        <p className="tutorial-complete-note">{t('tutorial.completeNote')}</p>
      )}
    </div>
  )
}
