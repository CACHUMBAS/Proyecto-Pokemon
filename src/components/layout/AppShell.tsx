import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../language/LanguageSwitcher'
import { PrismMark } from '../ui/PrismMark'
import './AppShell.css'

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skip')}
      </a>
      <header className="site-header page-width">
        <Link to="/" className="brand" aria-label={`PokePrisma · ${t('nav.home')}`}>
          <PrismMark />
          <span>
            Poke<span className="brand-light">Prisma</span>
            <small>CARD UNIVERSE</small>
          </span>
        </Link>
        <nav aria-label={t('nav.label')} className="main-nav">
          <NavLink to="/" end>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/catalogo">{t('nav.catalog')}</NavLink>
          <NavLink to="/equipo">{t('nav.team')}</NavLink>
          <NavLink to="/diseno">{t('nav.preview')}</NavLink>
        </nav>
        <LanguageSwitcher />
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="site-footer page-width">
        <div className="footer-top">
          <Link to="/" className="brand">
            <PrismMark />
            <span>PokePrisma</span>
          </Link>
          <span>{t('footer.tagline')}</span>
          <span className="micro-label">{t('footer.build')}</span>
        </div>
        <div className="footer-bottom">
          <p>{t('footer.note')}</p>
          <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">
            {t('footer.pokemon')} ↗
          </a>
          <a href="https://tcgdex.dev/" target="_blank" rel="noreferrer">
            {t('footer.sources')} ↗
          </a>
        </div>
      </footer>
    </>
  )
}
