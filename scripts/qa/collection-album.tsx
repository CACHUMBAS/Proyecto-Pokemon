import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { AppShell } from '../../src/components/layout/AppShell'
import { CollectionLayout } from '../../src/features/collection/CollectionLayout'
import { Inventory } from '../../src/features/collection/Inventory'
import { ConfirmOperation } from '../../src/features/collection/ConfirmOperation'
import { collectionFixture } from '../../src/collection/fixtures'
import type { CollectionCommand } from '../../src/collection/types'
import '../../src/i18n'
import '../../src/styles/fonts.css'
import '../../src/styles/global.css'
const data = collectionFixture()
const ids = [
  'sv03.5-198',
  'base1-58',
  'sv03.5-201',
  'base1-44',
  'sv03.5-172',
  'base1-46',
  'sv03.5-203',
  'base2-51',
  'sv03.5-095',
  'sv03.5-066',
  'base1-52',
  'base1-63',
].filter((id) => data.cards.some((c) => c.card_id === id))
data.inventory = ids.map((card_id, i) => ({ card_id, quantity: i % 3 === 0 ? 3 : 1 }))
export function AlbumProbe() {
  const [operation, setOperation] = useState<CollectionCommand | null>(null)
  const [notice, setNotice] = useState(false)
  return (
    <AppShell>
      <CollectionLayout packs={false}>
        <p className="collection-footnote">
          DEMO LOCAL · Colección simulada. No cambia cartas, fragmentos ni tu cuenta.
        </p>
        {notice && (
          <p className="collection-notice" role="status">
            DEMO · Confirmación comprobada. No se ha convertido ninguna carta.
          </p>
        )}
        <Inventory data={data} disabled={false} choose={setOperation} />
        {operation && (
          <ConfirmOperation
            command={operation}
            data={data}
            close={() => setOperation(null)}
            confirm={() => {
              setOperation(null)
              setNotice(true)
            }}
          />
        )}
      </CollectionLayout>
    </AppShell>
  )
}
if (import.meta.env.DEV)
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MemoryRouter initialEntries={['/coleccion']}>
        <AlbumProbe />
      </MemoryRouter>
    </StrictMode>,
  )
