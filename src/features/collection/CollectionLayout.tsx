import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  COLLECTION_THEME_KEY,
  readCollectionTheme,
  saveCollectionTheme,
  type CollectionTheme,
} from '../../collection/presentation'
import './CollectionPage.css'
import './CollectionExperience.css'
const storage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
}
export function CollectionLayout({ packs, children }: { packs: boolean; children: ReactNode }) {
  const { t } = useTranslation()
  const [theme, setTheme] = useState(() => readCollectionTheme(storage))
  const [temporary, setTemporary] = useState(false)
  useLayoutEffect(() => {
    document.documentElement.dataset.collectionTheme = theme
    return () => {
      delete document.documentElement.dataset.collectionTheme
    }
  }, [theme])
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === COLLECTION_THEME_KEY || event.key === null)
        setTheme(readCollectionTheme(storage))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  function choose(next: CollectionTheme) {
    setTheme(next)
    setTemporary(!saveCollectionTheme(storage, next))
  }
  return (
    <div className={'collection-page page-width' + (packs ? ' pack-gallery' : '')}>
      <div className="collection-toolbar">
        <nav className="collection-tabs" aria-label={t('collection.sections')}>
          <NavLink to="/coleccion">{t('collection.tabCollection')}</NavLink>
          <NavLink to="/sobres">{t('collection.tabPacks')}</NavLink>
          <Link to="/cuenta">{t('nav.account')} ↗</Link>
        </nav>
        <div>
          <div
            className="collection-theme-switch"
            role="group"
            aria-label={t('collection.design.theme')}
          >
            <button type="button" aria-pressed={theme === 'pearl'} onClick={() => choose('pearl')}>
              <span aria-hidden="true">☼</span> {t('collection.design.pearl')}
            </button>
            <button
              type="button"
              aria-pressed={theme === 'midnight'}
              onClick={() => choose('midnight')}
            >
              <span aria-hidden="true">☾</span> {t('collection.design.midnight')}
            </button>
          </div>
          {temporary && <small role="status">{t('collection.design.temporary')}</small>}
        </div>
      </div>
      <header className="collection-hero">
        <div>
          <span className="eyebrow">
            {t(packs ? 'collection.design.eyebrow' : 'collection.eyebrow')}
          </span>
          <h1>{t(packs ? 'collection.packHeading' : 'collection.heading')}</h1>
          <p>{t(packs ? 'collection.packIntro' : 'collection.intro')}</p>
        </div>
        <span className="collection-edition" aria-hidden="true">
          L / 01<span>PRISMA</span>
        </span>
      </header>
      {children}
    </div>
  )
}
