import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { accountClient, accountConfig, accountStore, recoveryGate } from '../../account/client'
import { Button } from '../../components/ui/Button'
import { PrismMark } from '../../components/ui/PrismMark'
import { AccountForms } from './AccountForms'
import { PlayerProfile } from './PlayerProfile'
import './AccountPage.css'

function AccountFrame({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="account-page page-width">
      <aside className="account-intro">
        <span className="eyebrow">{t('account.eyebrow')}</span>
        <h1>{t('account.title')}</h1>
        <p>{t('account.description')}</p>
        <div className="account-emblem" aria-hidden="true">
          <PrismMark />
        </div>
        <ol className="account-steps">
          <li>
            <span>01</span>
            <div>
              <strong>{t('account.stepIdentity')}</strong>
              <p>{t('account.stepIdentityText')}</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>{t('account.stepProfile')}</strong>
              <p>{t('account.stepProfileText')}</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>{t('account.stepCollection')}</strong>
              <p>{t('account.stepCollectionText')}</p>
            </div>
          </li>
        </ol>
        <Link to="/practica" className="account-return">
          {t('account.practiceLink')} ↗
        </Link>
      </aside>
      <div className="account-content">{children}</div>
    </div>
  )
}
function ConnectedAccount() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const client = accountClient!
  const store = accountStore!
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [signingOut, setSigningOut] = useState(false)
  const [logoutError, setLogoutError] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  useEffect(() => store.start(), [store])
  const recovering = location.pathname === '/cuenta/recuperar'
  async function signOut() {
    setSigningOut(true)
    setLogoutError(false)
    setPasswordUpdated(false)
    try {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
      await store.refresh()
      navigate('/cuenta', { replace: true })
    } catch {
      setLogoutError(true)
    } finally {
      setSigningOut(false)
    }
  }
  return (
    <AccountFrame>
      {passwordUpdated && (
        <p role="status" className="account-message">
          {t('account.notices.passwordUpdated')}
        </p>
      )}
      {snapshot.status === 'loading' && (
        <div className="account-form-panel" role="status">
          {t('account.loading')}
        </div>
      )}
      {snapshot.status === 'error' && (
        <div className="account-form-panel">
          <h2>{t('account.loadErrorTitle')}</h2>
          <p role="alert">{t('account.loadError')}</p>
          <Button onClick={() => void store.refresh()}>{t('account.retry')}</Button>
        </div>
      )}
      {snapshot.status === 'signedOut' && (
        <>
          {recovering && (
            <p className="account-message account-error" role="alert">
              {t('account.errors.expiredLink')}
            </p>
          )}
          <AccountForms
            key={location.pathname}
            client={client}
            initialMode={recovering ? 'reset' : 'signin'}
          />
        </>
      )}
      {snapshot.status === 'ready' &&
        snapshot.user &&
        snapshot.profile &&
        (recovering ? (
          recoveryGate.allows(snapshot.user.id) ? (
            <AccountForms
              client={client}
              initialMode="updatePassword"
              allowPasswordUpdate={() => recoveryGate.allows(snapshot.user!.id)}
              onPasswordUpdated={() => {
                setPasswordUpdated(true)
                navigate('/cuenta', { replace: true })
              }}
            />
          ) : (
            <>
              <p className="account-message account-error" role="alert">
                {t('account.errors.expiredLink')}
              </p>
              <AccountForms client={client} initialMode="reset" />
            </>
          )
        ) : (
          <PlayerProfile
            key={snapshot.user.id + snapshot.profile.displayName}
            client={client}
            profile={snapshot.profile}
            email={snapshot.user.email}
            refresh={store.refresh}
          />
        ))}
      {snapshot.status !== 'signedOut' && (
        <Button variant="secondary" disabled={signingOut} onClick={() => void signOut()}>
          {t(signingOut ? 'account.busy' : 'account.signout')}
        </Button>
      )}
      {logoutError && (
        <p className="account-message account-error" role="alert">
          {t('account.errors.request')}
        </p>
      )}
    </AccountFrame>
  )
}
export function AccountPage() {
  const { t } = useTranslation()
  if (!accountClient || !accountStore)
    return (
      <AccountFrame>
        <div className="account-message" role="status">
          <strong>{t('account.unavailableTitle')}</strong>
          <p>
            {t(accountConfig.kind === 'invalid' ? 'account.invalidConfig' : 'account.unavailable')}
          </p>
        </div>
        <AccountForms client={null} />
      </AccountFrame>
    )
  return <ConnectedAccount />
}
