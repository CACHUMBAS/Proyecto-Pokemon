import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import type { CollectionCommand, CollectionSnapshot } from '../../collection/types'
import { cardLabel } from './card-data'
export function ConfirmOperation({
  command,
  data,
  confirm,
  close,
}: {
  command: CollectionCommand
  data: CollectionSnapshot
  confirm: () => void
  close: () => void
}) {
  const { t, i18n } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  // Close before DOM removal so native focus restoration still has an opener.
  useLayoutEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])
  const label =
    command.kind === 'starter'
      ? t('collection.starter.names.' + command.starterId)
      : command.kind === 'fragment'
        ? cardLabel(command.cardId, i18n.language === 'en' ? 'en' : 'es')
        : t('collection.packs.title')
  const amount =
    command.kind === 'fragment'
      ? data.cards.find((c) => c.card_id === command.cardId)!.fragment_value
      : command.kind === 'pack'
        ? command.currency === 'coins'
          ? data.pack.coins
          : command.currency === 'fragments'
            ? data.pack.fragments
            : 0
        : 0
  return (
    <dialog
      className="collection-confirm"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      aria-labelledby="collection-confirm-title"
      aria-describedby="collection-confirm-description"
    >
      <span className="eyebrow">{t('collection.confirm.eyebrow')}</span>
      <h2 id="collection-confirm-title">{label}</h2>
      <p id="collection-confirm-description">
        {t('collection.confirm.' + (command.kind === 'pack' ? command.currency : command.kind), {
          count: amount,
        })}
      </p>
      <div className="collection-confirm-actions">
        <Button variant="secondary" onClick={close}>
          {t('collection.confirm.cancel')}
        </Button>
        <Button onClick={confirm}>{t('collection.confirm.accept')}</Button>
      </div>
    </dialog>
  )
}
