import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { AppShell } from '../components/layout/AppShell'

export function App() {
  const { pathname, hash } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else if (previousPath.current !== pathname) {
      window.scrollTo(0, 0)
      document.getElementById('main')?.focus({ preventScroll: true })
    }
    previousPath.current = pathname
  }, [pathname, hash])
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
