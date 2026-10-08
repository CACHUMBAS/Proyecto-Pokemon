import { useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PokemonCard } from '../../components/cards/PokemonCard'
import { PrismMark } from '../../components/ui/PrismMark'
import { sampleCards } from '../preview/sample-cards'
import './LandingPage.css'

export function LandingPage() {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)
  const selected = sampleCards[active]
  return (
    <>
      <section className="hero page-width" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">{t('hero.eyebrow')}</p>
          <h1 id="hero-title">
            <span>{t('hero.line1')}</span>
            <span className="legend-word">
              {t('hero.line2')}
              <span className="spark" aria-hidden="true">
                ✧
              </span>
            </span>
            <span>{t('hero.line3')}</span>
          </h1>
          <p className="hero-description">{t('hero.description')}</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/diseno">
              {t('hero.cta')}
              <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" to="/#universo">
              {t('hero.secondary')}
              <span aria-hidden="true">↓</span>
            </Link>
          </div>
          <p className="development-note">
            <span aria-hidden="true" />
            {t('hero.note')}
          </p>
        </div>
        <div className="showcase">
          <div className="showcase-grid" aria-hidden="true" />
          <div className="showcase-top">
            <span className="micro-label">{t('hero.specimen')}</span>
            <span className="signal" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="orbital orbital-one" aria-hidden="true" />
          <div className="orbital orbital-two" aria-hidden="true" />
          <div className="showcase-coordinate" aria-hidden="true">
            PKP—{String(active + 1).padStart(3, '0')}
            <br />✦ PRISM SERIES
          </div>
          <div className="card-stage">
            {sampleCards.map((card, index) => {
              const position = (index - active + sampleCards.length) % sampleCards.length
              return (
                <div
                  key={card.id}
                  className={`stage-card stage-position-${position}`}
                  aria-hidden={position !== 0 ? true : undefined}
                >
                  <PokemonCard card={card} priority />
                </div>
              )
            })}
          </div>
          <div className="specimen-label" aria-live="polite">
            <span className="specimen-number">{String(active + 1).padStart(2, '0')}</span>
            <span>
              <strong>{selected.name}</strong>
              <small>{t(`rarities.${selected.rarityLabel}`)}</small>
            </span>
            <span className="specimen-star" aria-hidden="true">
              ✦
            </span>
          </div>
          <div className="showcase-bottom">
            <span className="micro-label">
              {t('hero.index')} <span className="muted">/ 03</span>
              <small className="artwork-language">{t('hero.cardLanguage')}</small>
            </span>
            <div className="showcase-controls">
              <button
                type="button"
                className="icon-button"
                aria-label={t('common.previous')}
                onClick={() => setActive((active + 2) % 3)}
              >
                ←
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t('common.next')}
                onClick={() => setActive((active + 1) % 3)}
              >
                →
              </button>
            </div>
          </div>
          <span className="frame-corner corner-one" aria-hidden="true" />
          <span className="frame-corner corner-two" aria-hidden="true" />
        </div>
      </section>
      <div className="intro-strip page-width">
        <span className="strip-symbol" aria-hidden="true">
          ✧
        </span>
        <p>
          {t('hero.caption')}
          <span>{t('hero.captionSub')}</span>
        </p>
        <span className="strip-line" aria-hidden="true" />
        <span className="micro-label">POKÉMON / TCG / PRISMA</span>
      </div>
      <section
        id="universo"
        className="universe page-width section-space"
        aria-labelledby="universe-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">{t('universe.eyebrow')}</p>
            <h2 id="universe-title">{t('universe.title')}</h2>
          </div>
          <p className="section-intro">{t('universe.intro')}</p>
        </div>
        <div className="feature-grid">
          <article className="feature feature-packs">
            <div className="feature-top">
              <span>01 / {t('universe.packsTag')}</span>
              <span aria-hidden="true">✦</span>
            </div>
            <div className="pack-art" aria-hidden="true">
              <div className="pack pack-back" />
              <div className="pack pack-front">
                <span>POKEPRISMA</span>
                <PrismMark />
                <span>PRISM COLLECTION</span>
              </div>
              <i className="pack-spark">✧</i>
            </div>
            <h3>{t('universe.packsTitle')}</h3>
            <p>{t('universe.packsText')}</p>
            <span className="planned-label">{t('universe.planned')}</span>
          </article>
          <article className="feature feature-team">
            <div className="feature-top">
              <span>02 / {t('universe.teamTag')}</span>
              <span aria-hidden="true">⌘</span>
            </div>
            <div className="team-art" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className={`team-slot team-slot-${i}`}>
                  <span className="pokeball" />
                  <small>0{i + 1}</small>
                </span>
              ))}
            </div>
            <h3>{t('universe.teamTitle')}</h3>
            <p>{t('universe.teamText')}</p>
            <span className="planned-label">{t('universe.planned')}</span>
          </article>
          <article className="feature feature-battle">
            <div className="feature-top">
              <span>03 / {t('universe.battleTag')}</span>
              <span aria-hidden="true">↗</span>
            </div>
            <div className="battle-art" aria-hidden="true">
              <span className="battle-ring" />
              <span className="battle-line" />
              <strong>VS</strong>
              <i className="battle-point point-one" />
              <i className="battle-point point-two" />
            </div>
            <h3>{t('universe.battleTitle')}</h3>
            <p>{t('universe.battleText')}</p>
            <span className="planned-label">{t('universe.planned')}</span>
          </article>
        </div>
      </section>
      <section id="camino" className="roadmap-wrap" aria-labelledby="roadmap-title">
        <div className="roadmap page-width section-space">
          <div className="roadmap-copy">
            <p className="eyebrow">{t('roadmap.eyebrow')}</p>
            <h2 id="roadmap-title">{t('roadmap.title')}</h2>
            <p>{t('roadmap.intro')}</p>
            <Link className="text-link" to="/diseno">
              {t('roadmap.cta')}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <ol className="roadmap-list">
            {[1, 2, 3, 4].map((step) => (
              <li key={step} className={step === 1 ? 'current-step' : ''}>
                <span className="step-index">0{step}</span>
                <div>
                  <div className="step-title">
                    <h3>{t(`roadmap.step${step}`)}</h3>
                    <span>{t(step === 1 ? 'roadmap.now' : 'roadmap.later')}</span>
                  </div>
                  <p>{t(`roadmap.desc${step}`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
