import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { PrismaPack } from './PrismaPack'
import { CollectionCard } from './CollectionCard'
import type {
  CollectionSnapshot,
  CollectionCommand,
  CollectionReceipt,
} from '../../collection/types'
import { cardLabel } from './card-data'
export function PackShop({
  data,
  disabled,
  choose,
  showReceipt,
}: {
  data: CollectionSnapshot
  disabled: boolean
  choose: (c: CollectionCommand) => void
  showReceipt: (r: CollectionReceipt) => void
}) {
  const { t, i18n } = useTranslation(),
    locale = i18n.language === 'en' ? 'en' : 'es'
  const pack = data.pack
  const featured = [
    ...new Map(data.cards.filter((c) => c.budget >= 276).map((c) => [c.species_id, c])).values(),
  ].slice(0, 2)
  const history = data.events.filter((r) => r.kind === 'pack')
  return (
    <section>
      <div className="collection-pack-shop">
        <div className="pack-showcase">
          <span className="pack-showcase-orbit" aria-hidden="true" />
          <span className="pack-showcase-word" aria-hidden="true">
            PRISMA
          </span>
          <div className="pack-showcase-cards" aria-hidden="true">
            {featured.map((c) => (
              <CollectionCard key={c.card_id} id={c.card_id} />
            ))}
          </div>
          <PrismaPack size={pack.size} />
          <span className="pack-showcase-caption">{t('collection.design.showcaseNote')}</span>
        </div>
        <div className="collection-pack-description">
          <span className="eyebrow">{t('collection.packs.eyebrow')}</span>
          <h2>
            {t('collection.packs.title')}
            <span className="pack-title-star" aria-hidden="true">
              ✦
            </span>
          </h2>
          <div className="pack-facts">
            <span>{t('collection.design.cardCount', { count: pack.size })}</span>
            <span>{t('collection.packs.variants', { count: data.cards.length })}</span>
          </div>
          <p className="collection-lead">
            {t('collection.packs.description', { count: data.cards.length })}
          </p>
          {data.wallet.welcome_available && (
            <div className="collection-welcome">
              <strong>{t('collection.packs.welcome')}</strong>
              <p>{t('collection.packs.welcomeText')}</p>
              <Button
                disabled={disabled}
                onClick={() => choose({ kind: 'pack', packId: pack.id, currency: 'welcome' })}
              >
                {t('collection.packs.openWelcome')}
              </Button>
            </div>
          )}
          <div className="collection-pack-payment">
            <Button
              disabled={disabled || data.wallet.coins < pack.coins}
              onClick={() => choose({ kind: 'pack', packId: pack.id, currency: 'coins' })}
            >
              {t('collection.packs.coins', { count: pack.coins })}
            </Button>
            <Button
              variant="secondary"
              disabled={disabled || data.wallet.fragments < pack.fragments}
              onClick={() => choose({ kind: 'pack', packId: pack.id, currency: 'fragments' })}
            >
              {t('collection.packs.fragments', { count: pack.fragments })}
            </Button>
          </div>
          <p className="collection-footnote">{t('collection.packs.noRewards')}</p>
        </div>
      </div>
      <details className="collection-odds pack-odds-details">
        <summary>
          {t('collection.packs.oddsTitle')} <span>↗</span>
        </summary>
        <p>{t('collection.packs.oddsText')}</p>
        <div className="collection-odds-grid">
          {pack.odds.map((o) => (
            <div key={o.budget} className={'tier-' + o.budget}>
              <strong>{(o.weight / 100).toLocaleString(locale)}%</strong>
              <span>{t('collection.tiers.' + o.budget)}</span>
              <small>{t('collection.packs.variants', { count: o.card_count })}</small>
            </div>
          ))}
        </div>
        <details>
          <summary>{t('collection.packs.pool')}</summary>
          <ul className="collection-pool">
            {data.cards.map((card) => {
              const odds = pack.odds.find((o) => o.budget === card.budget)!
              return (
                <li key={card.card_id}>
                  <span>
                    {cardLabel(card.card_id, locale)} <small>{card.card_id}</small>
                  </span>
                  <strong>
                    {(odds.weight / 100 / odds.card_count).toLocaleString(locale, {
                      maximumFractionDigits: 4,
                    })}
                    %
                  </strong>
                </li>
              )
            })}
          </ul>
        </details>
      </details>
      <section className="collection-history">
        <h3>{t('collection.packs.history')}</h3>
        <p className="collection-footnote">{t('collection.packs.historyText')}</p>
        {history.length ? (
          <ul>
            {history.map((receipt) => (
              <li key={receipt.request_id}>
                <div>
                  <strong>{t('collection.packs.title')}</strong>
                  <time dateTime={receipt.created_at}>
                    {new Date(receipt.created_at).toLocaleString(locale)}
                  </time>
                  <span>{t('collection.packs.paid.' + receipt.currency)}</span>
                </div>
                <Button variant="secondary" onClick={() => showReceipt(receipt)}>
                  {t('collection.packs.view')}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('collection.packs.noHistory')}</p>
        )}
      </section>
    </section>
  )
}
