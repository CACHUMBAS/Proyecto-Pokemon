import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { accountClient, accountStore } from '../../account/client'
import { createCollectionGateway, pendingStorage } from '../../collection/gateway'
import { createCollectionStore } from '../../collection/store'
import type { CollectionCommand, CollectionReceipt } from '../../collection/types'
import { Button } from '../../components/ui/Button'
import { StarterPicker } from './StarterPicker'
import { Inventory } from './Inventory'
import { PackShop } from './PackShop'
import { ReceiptView } from './ReceiptView'
import { ConfirmOperation } from './ConfirmOperation'
import { CollectionLayout } from './CollectionLayout'
function PlayerCollection({ userId, packs }: { userId: string; packs: boolean }) {
  const { t } = useTranslation()
  const [store] = useState(() =>
    createCollectionStore(createCollectionGateway(accountClient!, userId), pendingStorage(userId)),
  )
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [confirmation, setConfirmation] = useState<CollectionCommand | null>(null)
  const [historyReceipt, setHistoryReceipt] = useState<CollectionReceipt | null>(null)
  useEffect(() => store.start(), [store])
  useEffect(() => {
    const visible = () => {
      if (document.visibilityState === 'visible') void store.refresh()
    }
    document.addEventListener('visibilitychange', visible)
    return () => document.removeEventListener('visibilitychange', visible)
  }, [store])
  const data = state.data,
    receipt = historyReceipt ?? state.receipt
  const disabled = state.busy || Boolean(state.pending)
  return (
    <>
      {data && (
        <div className="collection-wallet" aria-label={t('collection.wallet.title')}>
          <div>
            <span>{t('collection.wallet.coins')}</span>
            <strong>{data.wallet.coins.toLocaleString()}</strong>
          </div>
          <div>
            <span>{t('collection.wallet.fragments')}</span>
            <strong>{data.wallet.fragments.toLocaleString()}</strong>
          </div>
          <div>
            <span>{t('collection.wallet.cards')}</span>
            <strong>
              {data.inventory.reduce((sum, c) => sum + c.quantity, 0).toLocaleString()}
            </strong>
          </div>
          <span className="collection-synced">● {t('collection.wallet.saved')}</span>
        </div>
      )}
      <div className="collection-status-row" aria-busy={state.busy}>
        {state.busy && <p role="status">{t('collection.busy')}</p>}
        {state.error && (
          <p role="alert" className="collection-error">
            {t('collection.errors.' + state.error)}
          </p>
        )}
        {state.pending && !state.busy ? (
          <Button onClick={() => void store.retry()}>{t('collection.retryOperation')}</Button>
        ) : state.error && !state.busy ? (
          <Button variant="secondary" onClick={() => void store.refresh()}>
            {t('collection.refresh')}
          </Button>
        ) : null}
        {state.status === 'loading' && !state.busy && (
          <p role="status">{t('collection.loading')}</p>
        )}
      </div>
      {receipt && <ReceiptView key={receipt.request_id} receipt={receipt} />}
      {data &&
        (data.wallet.starter_id ? (
          packs ? (
            <PackShop
              data={data}
              disabled={disabled}
              choose={setConfirmation}
              showReceipt={setHistoryReceipt}
            />
          ) : (
            <Inventory data={data} disabled={disabled} choose={setConfirmation} />
          )
        ) : (
          <StarterPicker data={data} disabled={disabled} choose={setConfirmation} />
        ))}
      {confirmation && data && (
        <ConfirmOperation
          command={confirmation}
          data={data}
          close={() => setConfirmation(null)}
          confirm={() => {
            const command = confirmation
            setConfirmation(null)
            setHistoryReceipt(null)
            void store.submit(command)
          }}
        />
      )}
    </>
  )
}
function ConnectedCollection({ packs }: { packs: boolean }) {
  const { t } = useTranslation(),
    store = accountStore!
  const account = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => store.start(), [store])
  if (account.status === 'loading')
    return (
      <p role="status" className="collection-notice">
        {t('account.loading')}
      </p>
    )
  if (account.status === 'error')
    return (
      <div className="collection-notice">
        <p role="alert">{t('account.loadError')}</p>
        <Button onClick={() => void store.refresh()}>{t('account.retry')}</Button>
      </div>
    )
  if (!account.user)
    return (
      <div className="collection-guest">
        <span className="eyebrow">{t('collection.guest.eyebrow')}</span>
        <h2>{t('collection.guest.title')}</h2>
        <p>{t('collection.guest.description')}</p>
        <Link className="button button-primary" to="/cuenta">
          {t('collection.guest.login')}
        </Link>
      </div>
    )
  return <PlayerCollection key={account.user.id} userId={account.user.id} packs={packs} />
}
export function CollectionPage() {
  const { t } = useTranslation()
  const packs = useLocation().pathname === '/sobres'
  return (
    <CollectionLayout packs={packs}>
      {accountClient && accountStore ? (
        <ConnectedCollection packs={packs} />
      ) : (
        <p role="status" className="collection-notice">
          {t('account.unavailable')}
        </p>
      )}
    </CollectionLayout>
  )
}
