import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppShell } from '../components/layout/AppShell'

export function App() {
  const { pathname, hash, key } = useLocation()
  const previousNavigation = useRef(key)
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else if (previousNavigation.current !== key) {
      // The same route can be activated again, including after clearing an anchor.
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.getElementById('main')?.focus({ preventScroll: true })
    }
    previousNavigation.current = key
  }, [pathname, hash, key])
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
