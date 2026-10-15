import { useTranslation } from 'react-i18next'
import { getPracticeOpponent, listPracticeOpponents } from '../../battle/opponents'
import type { PracticeOpponentId } from '../../battle/opponents'
import { cardsById, fighterName, speciesById } from './practice-data'
import './OpponentPicker.css'

const opponents = listPracticeOpponents()
interface Props {
  value: PracticeOpponentId
  onChange: (id: PracticeOpponentId) => void
}
export function OpponentPicker({ value, onChange }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en' : 'es'
  const selected = getPracticeOpponent(value)
  return (
    <fieldset className="practice-opponents" aria-describedby="opponents-hint">
      <legend>{t('opponents.title')}</legend>
      <p id="opponents-hint" className="practice-note">
        {t('opponents.hint')}
      </p>
      <div className="opponent-options">
        {opponents.map((opponent, index) => (
          <label key={opponent.id} className="opponent-option">
            <input
              type="radio"
              name="practice-opponent"
              value={opponent.id}
              checked={value === opponent.id}
              onChange={() => onChange(opponent.id)}
              aria-label={
                t('opponents.' + opponent.id + '.name') +
                ' · ' +
                t('opponents.' + opponent.id + '.level')
              }
            />
            <span className="opponent-level" aria-hidden="true">
              {'◆'.repeat(index + 1)}
            </span>
            <strong>{t('opponents.' + opponent.id + '.name')}</strong>
            <small>{t('opponents.' + opponent.id + '.level')}</small>
          </label>
        ))}
      </div>
      <div className="opponent-preview">
        <p className="opponent-summary" role="status">
          {t('opponents.' + value + '.description')}
        </p>
        <ol aria-label={t('opponents.team')}>
          {selected.cardIds.map((id, index) => {
            const card = cardsById.get(id)!
            return (
              <li key={id}>
                <span className="opponent-slot" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong>
                    {fighterName(id, locale)}
                    {index === 0 && <em> · {t('practice.lead')}</em>}
                  </strong>
                  <span>
                    {speciesById
                      .get(card.speciesId)!
                      .types.map((type) => t('pokemonTypes.' + type))
                      .join(' / ')}
                  </span>
                  <small>
                    {t('rarities.' + card.rarity, { defaultValue: card.rarity })} · {id}
                  </small>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </fieldset>
  )
}
