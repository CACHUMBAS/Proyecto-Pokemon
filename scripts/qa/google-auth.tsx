import { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AccountForms } from '../../src/features/account/AccountForms'
import { AppShell } from '../../src/components/layout/AppShell'
import '../../src/i18n'
import '../../src/styles/global.css'
import '../../src/features/account/AccountPage.css'

export function Probe() {
  const [scenario, setScenario] = useState('failure')
  const [enabled, setEnabled] = useState(true)
  const [calls, setCalls] = useState(0)
  const [request, setRequest] = useState('')
  const total = useRef(0)
  const client = {
    auth: {
      signInWithOAuth: async (input: unknown) => {
        setCalls(++total.current)
        setRequest(JSON.stringify(input))
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return scenario === 'success'
          ? { data: { url: 'https://example.supabase.co/auth/v1/authorize' }, error: null }
          : { data: { url: null }, error: new Error('Simulated provider failure') }
      },
      signInWithPassword: async () => ({ error: { code: 'invalid_credentials' } }),
      signUp: async () => ({ error: { code: 'email_address_not_authorized' } }),
      resetPasswordForEmail: async () => ({ error: null }),
    },
  } as unknown as SupabaseClient
  return (
    <AppShell>
      <main className="page-width" style={{ paddingBlock: 32 }}>
        <h1>Prueba local de Google · sin cuentas reales</h1>
        <p>
          La respuesta está simulada. Esta página no configura Google ni demuestra un acceso real.
        </p>
        <label>
          Respuesta simulada{' '}
          <select value={scenario} onChange={(event) => setScenario(event.target.value)}>
            <option value="failure">Error recuperable</option>
            <option value="success">Redirección pendiente</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />{' '}
          Google habilitado
        </label>
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
          }
        >
          Simular volver del navegador
        </button>
        <p role="status">Intentos: {calls}</p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{request}</pre>
        <div style={{ maxWidth: 540, margin: '24px auto' }}>
          <AccountForms client={client} googleEnabled={enabled} />
        </div>
      </main>
    </AppShell>
  )
}
if (import.meta.env.DEV)
  createRoot(document.getElementById('root')!).render(
    <MemoryRouter>
      <Probe />
    </MemoryRouter>,
  )
