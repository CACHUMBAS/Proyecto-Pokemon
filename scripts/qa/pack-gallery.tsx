import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { AppShell } from '../../src/components/layout/AppShell'
import { CollectionLayout } from '../../src/features/collection/CollectionLayout'
import { PackShop } from '../../src/features/collection/PackShop'
import { ReceiptView } from '../../src/features/collection/ReceiptView'
import { ConfirmOperation } from '../../src/features/collection/ConfirmOperation'
import { collectionFixture, receiptFixture } from '../../src/collection/fixtures'
import type { CollectionCommand } from '../../src/collection/types'
import '../../src/i18n'
import '../../src/styles/fonts.css'
import '../../src/styles/global.css'
const data = collectionFixture()
data.wallet = {
  coins: 250,
  fragments: 40,
  starter_id: 'alba',
  welcome_available: false,
  revision: 1,
}
const sample = {
  ...receiptFixture(),
  kind: 'pack' as const,
  reference: 'prisma-v1',
  quantity: 3,
  currency: 'coins' as const,
  coins_delta: -100,
  card_ids: [
    data.cards.find((c) => c.budget === 240)!.card_id,
    data.cards.find((c) => c.budget === 288)!.card_id,
    data.cards.find((c) => c.budget === 240)!.card_id,
  ],
}
data.events = [sample]
export function GalleryProbe() {
  const [operation, setOperation] = useState<CollectionCommand | null>(null)
  const [receipt, setReceipt] = useState(false)
  const [version, setVersion] = useState(0)
  return (
    <AppShell>
      <CollectionLayout packs>
        <p className="collection-footnote" style={{ marginTop: 0 }}>
          DEMO LOCAL · Saldo y cartas simulados. No realiza compras ni cambia tu cuenta.
        </p>
        <div className="collection-wallet">
          <div>
            <span>Monedas</span>
            <strong>250</strong>
          </div>
          <div>
            <span>Fragmentos</span>
            <strong>40</strong>
          </div>
          <div>
            <span>Cartas</span>
            <strong>12</strong>
          </div>
          <span className="collection-synced">DEMO · SIN CONEXIÓN</span>
        </div>
        {receipt && <ReceiptView key={version} receipt={sample} />}
        <PackShop
          data={data}
          disabled={false}
          choose={setOperation}
          showReceipt={() => {
            setVersion((v) => v + 1)
            setReceipt(true)
          }}
        />
        {operation && (
          <ConfirmOperation
            command={operation}
            data={data}
            close={() => setOperation(null)}
            confirm={() => {
              setOperation(null)
              setVersion((v) => v + 1)
              setReceipt(true)
            }}
          />
        )}
      </CollectionLayout>
    </AppShell>
  )
}
if (import.meta.env.DEV)
  createRoot(document.getElementById('root')!).render(
    <MemoryRouter initialEntries={['/sobres']}>
      <GalleryProbe />
    </MemoryRouter>,
  )
