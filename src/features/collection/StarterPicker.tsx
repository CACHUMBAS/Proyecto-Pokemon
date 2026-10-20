import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import type { CollectionSnapshot, CollectionCommand } from '../../collection/types'
import { cardLabel, collectionSpecies } from './card-data'
export function StarterPicker({
  data,
  disabled,
  choose,
}: {
  data: CollectionSnapshot
  disabled: boolean
  choose: (c: CollectionCommand) => void
}) {
  const { i18n, t } = useTranslation(),
    locale = i18n.language === 'en' ? 'en' : 'es'
  return (
    <section className="collection-start">
      <span className="eyebrow">{t('collection.starter.eyebrow')}</span>
      <h2>{t('collection.starter.title')}</h2>
      <p className="collection-lead">{t('collection.starter.description')}</p>
      <div className="collection-starter-grid">
        {data.starters.map((kit, index) => (
          <article className={'collection-starter starter-' + kit.id} key={kit.id}>
            <span className="collection-kit-number">0{index + 1}</span>
            <h3>{t('collection.starter.names.' + kit.id, { defaultValue: kit.id })}</h3>
            <div className="collection-kit-types">
              {Array.from(
                new Set(
                  kit.card_ids.flatMap(
                    (id) =>
                      collectionSpecies.get(data.cards.find((c) => c.card_id === id)!.species_id)
                        ?.types ?? [],
                  ),
                ),
              ).map((type) => (
                <span key={type}>{t('types.' + type, { defaultValue: type })}</span>
              ))}
            </div>
            <ul>
              {kit.card_ids.map((id) => (
                <li key={id}>
                  <span aria-hidden="true">◇</span>
                  {cardLabel(id, locale)}
                  <small>{id}</small>
                </li>
              ))}
            </ul>
            <p className="collection-kit-gift">{t('collection.starter.gift')}</p>
            <Button
              disabled={disabled}
              onClick={() => choose({ kind: 'starter', starterId: kit.id })}
            >
              {t('collection.starter.choose')}
            </Button>
          </article>
        ))}
      </div>
      <p className="collection-footnote">{t('collection.starter.balance')}</p>
    </section>
  )
}
