import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import type { CollectionReceipt } from '../../collection/types'
import { completedTear, revealStep, type RevealState } from '../../collection/presentation'
import { CollectionCard } from './CollectionCard'
import { collectionFighters } from './card-data'
import { PrismaPack } from './PrismaPack'

function PackReceipt({ receipt }: { receipt: CollectionReceipt }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)
  const [state, setState] = useState<RevealState>({ phase: 'sealed', visible: 0 })
  const [skip, setSkip] = useState(false)
  const replayButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null)
  const count = receipt.card_ids.length
  useEffect(() => {
    const element = dialog.current!
    if (open) element.showModal()
    else {
      element.close()
      replayButton.current?.focus()
    }
    return () => element.close()
  }, [open])
  useEffect(() => {
    if (state.phase !== 'sealed' && open) nextButton.current?.focus()
  }, [state.phase, open])
  function step(action: 'open' | 'next' | 'all') {
    if (action === 'all') setSkip(true)
    setState((current) => revealStep(current, action, count))
  }
  const id = receipt.card_ids[state.visible - 1]
  const budget = collectionFighters.get(id)?.budget ?? 240
  function replay() {
    setSkip(false)
    setState({ phase: 'sealed', visible: 0 })
    setOpen(true)
  }
  return (
    <>
      <section className="pack-receipt-banner" aria-label={t('collection.result.title')}>
        <span className="pack-saved-icon" aria-hidden="true">
          ✓
        </span>
        <div>
          <strong>{t('collection.result.saved')}</strong>
          <p>{t('collection.design.savedNote')}</p>
        </div>
        <button
          type="button"
          ref={replayButton}
          className="button button-secondary"
          onClick={replay}
        >
          {t('collection.design.replay')}
        </button>
      </section>
      <dialog
        ref={dialog}
        className={'pack-opening' + (skip ? ' pack-opening-skip' : '')}
        aria-labelledby={'opening-' + receipt.request_id}
        onCancel={(event) => {
          event.preventDefault()
          setOpen(false)
        }}
      >
        <div className="opening-toolbar">
          <span className="eyebrow">LUMEMON / PRISMA</span>
          <button
            type="button"
            className="opening-close"
            onClick={() => setOpen(false)}
            aria-label={t('collection.design.close')}
          >
            ×
          </button>
        </div>
        <div className="opening-heading">
          <span className="micro-label">{t('collection.result.saved')}</span>
          <h2 id={'opening-' + receipt.request_id}>
            {t(
              'collection.design.' +
                (state.phase === 'sealed'
                  ? 'openingTitle'
                  : state.phase === 'cards'
                    ? 'revealTitle'
                    : 'summaryTitle'),
            )}
          </h2>
          <p>
            {state.phase === 'cards'
              ? t('collection.design.progress', { current: state.visible, total: count })
              : t('collection.design.' + (state.phase === 'sealed' ? 'tearHint' : 'savedNote'))}
          </p>
        </div>
        {state.phase === 'sealed' ? (
          <div className="opening-sealed">
            <div
              className="opening-tear"
              onPointerDown={(event) => {
                if (event.button !== 0) return
                pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerUp={(event) => {
                const start = pointer.current
                pointer.current = null
                if (
                  start?.id === event.pointerId &&
                  completedTear(
                    event.clientX - start.x,
                    event.clientY - start.y,
                    event.currentTarget.clientWidth,
                  )
                )
                  step('open')
              }}
              onPointerCancel={() => {
                pointer.current = null
              }}
            >
              <PrismaPack size={count} />
              <span className="opening-cut" aria-hidden="true">
                ✧ ┄ ┄ ┄ ┄ ┄ ┄ ┄ →
              </span>
            </div>
            <Button onClick={() => step('open')}>{t('collection.design.open')}</Button>
          </div>
        ) : state.phase === 'cards' ? (
          <div className={'opening-card-stage tier-' + budget}>
            <div className="opening-aura" aria-hidden="true" />
            <div key={state.visible} className="opening-revealed-card">
              <CollectionCard id={id} priority />
              <span className="opening-rarity">✦ {t('collection.tiers.' + budget)}</span>
            </div>
            {state.visible === 1 && (
              <div className="opening-afterimage" aria-hidden="true">
                <PrismaPack size={count} />
              </div>
            )}
            <div className="opening-progress" aria-hidden="true">
              {receipt.card_ids.map((_, i) => (
                <span key={i} className={i < state.visible ? 'is-revealed' : ''} />
              ))}
            </div>
            <button
              type="button"
              ref={nextButton}
              className="button button-primary"
              onClick={() => step('next')}
            >
              {t(state.visible === count ? 'collection.design.summary' : 'collection.design.next')}{' '}
              →
            </button>
          </div>
        ) : (
          <div className="opening-summary">
            <div className="opening-summary-grid">
              {receipt.card_ids.map((cardId, index) => (
                <div key={index + '-' + cardId} style={{ animationDelay: index * 90 + 'ms' }}>
                  <CollectionCard id={cardId} priority />
                </div>
              ))}
            </div>
            <button
              type="button"
              ref={nextButton}
              className="button button-primary"
              onClick={() => setOpen(false)}
            >
              {t('collection.design.done')}
            </button>
          </div>
        )}
        <div className="opening-bottom">
          <span>{t('collection.design.alreadySaved')}</span>
          {state.phase !== 'summary' && (
            <button type="button" onClick={() => step('all')}>
              {t('collection.design.showAll')} ↗
            </button>
          )}
        </div>
        <span className="sr-only" role="status">
          {state.phase === 'cards'
            ? t('collection.design.progress', { current: state.visible, total: count })
            : ''}
        </span>
      </dialog>
    </>
  )
}
export function ReceiptView({ receipt }: { receipt: CollectionReceipt }) {
  const { t } = useTranslation()
  if (receipt.kind === 'pack') return <PackReceipt key={receipt.request_id} receipt={receipt} />
  return (
    <p role="status" className="collection-success">
      {t(receipt.kind === 'starter' ? 'collection.result.starter' : 'collection.result.fragment', {
        count: receipt.fragments_delta,
      })}
    </p>
  )
}
