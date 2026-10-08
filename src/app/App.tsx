import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppShell } from '../components/layout/AppShell'

export function App() {
  const location = useLocation()
  const previousNavigation = useRef(location)
  useEffect(() => {
    const previous = previousNavigation.current
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView()
    else if (
      previous.key !== location.key &&
      (previous.pathname !== location.pathname ||
        previous.hash !== location.hash ||
        (location.pathname === '/' && previous.search === location.search))
    ) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.getElementById('main')?.focus({ preventScroll: true })
    }
    previousNavigation.current = location
  }, [location])
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
