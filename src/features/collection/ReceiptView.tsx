import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import type { CollectionReceipt } from '../../collection/types'
import { CollectionCard } from './CollectionCard'
export function ReceiptView({ receipt }: { receipt: CollectionReceipt }) {
  const { t } = useTranslation()
  const [revealed, setRevealed] = useState(false),
    [skip, setSkip] = useState(false)
  if (receipt.kind !== 'pack')
    return (
      <p role="status" className="collection-success">
        {t(
          receipt.kind === 'starter' ? 'collection.result.starter' : 'collection.result.fragment',
          { count: receipt.fragments_delta },
        )}
      </p>
    )
  return (
    <section className="collection-result" aria-labelledby={'receipt-' + receipt.request_id}>
      <span className="eyebrow">{t('collection.result.saved')}</span>
      <h2 id={'receipt-' + receipt.request_id}>{t('collection.result.title')}</h2>
      <p>{t('collection.result.description')}</p>
      {!revealed ? (
        <div className="collection-reveal-actions">
          <Button onClick={() => setRevealed(true)}>{t('collection.result.reveal')}</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSkip(true)
              setRevealed(true)
            }}
          >
            {t('collection.result.skip')}
          </Button>
        </div>
      ) : (
        <div
          className={'collection-revealed' + (skip ? ' collection-no-motion' : '')}
          role="status"
        >
          {receipt.card_ids.map((id, index) => (
            <div key={index + '-' + id} style={{ animationDelay: index * 90 + 'ms' }}>
              <CollectionCard id={id} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
