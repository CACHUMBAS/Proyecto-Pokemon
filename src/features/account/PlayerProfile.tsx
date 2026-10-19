import { useRef, useState, type FormEvent } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { saveDisplayName, accountErrorCode } from '../../account/gateway'
import { normalizeDisplayName, type PlayerProfile as Profile } from '../../account/validation'

export function PlayerProfile({
  client,
  profile,
  email,
  refresh,
}: {
  client: SupabaseClient
  profile: Profile
  email: string
  refresh: () => Promise<void>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(profile.displayName)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  async function save(event: FormEvent) {
    event.preventDefault()
    if (pending.current) return
    if (!normalizeDisplayName(name)) {
      setError('displayName')
      return
    }
    pending.current = true
    setBusy(true)
    setError(null)
    try {
      await saveDisplayName(client, profile.id, name)
      await refresh()
    } catch (cause) {
      setError(accountErrorCode(cause))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <section className="account-form-panel" aria-label={t('account.profile')}>
      <span className="account-status">
        <span aria-hidden="true">●</span> {t('account.connected')}
      </span>
      <h2>{t('account.welcome', { name: profile.displayName })}</h2>
      <p className="account-email">{email}</p>
      <form onSubmit={save} noValidate aria-busy={busy}>
        <label htmlFor="player-name">
          {t('account.displayName')}
          <input
            id="player-name"
            autoComplete="nickname"
            value={name}
            disabled={busy}
            onChange={(e) => setName(e.target.value)}
            aria-describedby="name-hint"
            required
          />
        </label>
        <p id="name-hint" className="account-input-hint">
          {t('account.nameHint')}
        </p>
        <Button type="submit" disabled={busy}>
          {busy ? t('account.busy') : t('account.saveName')}
        </Button>
        {error && (
          <p className="account-message account-error" role="alert">
            {t('account.errors.' + error)}
          </p>
        )}
      </form>
      <p className="account-scope">{t('account.profileScope')}</p>
    </section>
  )
}
