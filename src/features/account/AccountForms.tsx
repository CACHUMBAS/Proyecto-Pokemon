import { useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { accountErrorCode } from '../../account/gateway'
import { validateCredentials, type AccountMode } from '../../account/validation'

type Props = {
  client: SupabaseClient | null
  initialMode?: AccountMode
  allowPasswordUpdate?: () => boolean
  onPasswordUpdated?: () => void
}
export function AccountForms({
  client,
  initialMode = 'signin',
  allowPasswordUpdate,
  onPasswordUpdated,
}: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<AccountMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const isNewPassword = mode === 'signup' || mode === 'updatePassword'
  function changeMode(next: AccountMode) {
    setMode(next)
    setError(null)
    setNotice(null)
    setPassword('')
    setConfirm('')
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client || pending.current) return
    const invalid = validateCredentials(mode, email, password, confirm)
    if (invalid) {
      setError(invalid)
      return
    }
    if (mode === 'updatePassword' && !allowPasswordUpdate?.()) {
      setError('expiredLink')
      return
    }
    pending.current = true
    setBusy(true)
    setError(null)
    setNotice(null)
    const redirectTo = new URL('/cuenta', window.location.origin).href
    try {
      if (mode === 'signin') {
        const result = await client.auth.signInWithPassword({ email: email.trim(), password })
        if (result.error) throw result.error
      } else if (mode === 'signup') {
        const result = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirectTo },
        })
        if (result.error) throw result.error
        setNotice('checkEmail')
      } else if (mode === 'reset') {
        const result = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectTo + '/recuperar',
        })
        if (result.error) throw result.error
        setNotice('resetSent')
      } else {
        const result = await client.auth.updateUser({ password })
        if (result.error) throw result.error
        onPasswordUpdated?.()
      }
      setPassword('')
      setConfirm('')
    } catch (cause) {
      setError(accountErrorCode(cause))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <div className="account-form-panel">
      {mode !== 'updatePassword' && (
        <div className="account-tabs" aria-label={t('account.chooseAction')}>
          {(['signin', 'signup'] as const).map((item) => (
            <button
              key={item}
              type="button"
              disabled={busy}
              aria-pressed={mode === item}
              onClick={() => changeMode(item)}
            >
              {t('account.' + item)}
            </button>
          ))}
        </div>
      )}
      <h2>{t('account.forms.' + mode)}</h2>
      <p className="account-muted">{t('account.hints.' + mode)}</p>
      <form onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={!client || busy}>
          <legend className="sr-only">{t('account.forms.' + mode)}</legend>
          {mode !== 'updatePassword' && (
            <label htmlFor="account-email">
              {t('account.email')}
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {mode !== 'reset' && (
            <label htmlFor="account-password">
              {t(isNewPassword ? 'account.newPassword' : 'account.password')}
              <input
                id="account-password"
                type="password"
                autoComplete={isNewPassword ? 'new-password' : 'current-password'}
                maxLength={isNewPassword ? 128 : undefined}
                required
                value={password}
                aria-describedby={isNewPassword ? 'password-hint' : undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}
          {isNewPassword && (
            <>
              <p className="account-input-hint" id="password-hint">
                {t('account.passwordHint')}
              </p>
              <label htmlFor="account-confirm">
                {t('account.confirmPassword')}
                <input
                  id="account-confirm"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            </>
          )}
          <Button type="submit">
            {busy ? t('account.busy') : t('account.submit.' + mode)}{' '}
            <span aria-hidden="true">↗</span>
          </Button>
        </fieldset>
        {error && (
          <p className="account-message account-error" role="alert">
            {t('account.errors.' + error)}
          </p>
        )}
        {notice && (
          <p className="account-message" role="status">
            {t('account.notices.' + notice)}
          </p>
        )}
      </form>
      {mode === 'signin' && (
        <button
          type="button"
          className="account-text-button"
          disabled={busy}
          onClick={() => changeMode('reset')}
        >
          {t('account.forgot')}
        </button>
      )}
    </div>
  )
}
