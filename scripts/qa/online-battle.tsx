import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { createOnlineStore } from '../../src/online-battle/store'
import { battleStorage } from '../../src/online-battle/gateway'
import { BattleFailure, sameCommand } from '../../src/online-battle/protocol'
import type { PendingBattle } from '../../src/online-battle/protocol'
import { createPractice, practiceReducer } from '../../src/battle/practice'
import type { PracticeSession } from '../../src/battle/practice'
import { OnlineBattleScreen } from '../../src/features/online-battle/OnlineBattlePage'
import { AppShell } from '../../src/components/layout/AppShell'
import '../../src/i18n'
import '../../src/styles/global.css'
const user = 'dd200000-0000-4000-8000-000000000001'
const team = ['base1-44', 'base1-46', 'base1-63', 'base1-58', 'base1-52', 'base2-51', 'xy1-1']
type State = {
  session: PracticeSession | null
  revision: number
  status: 'active' | 'finished' | 'abandoned'
  receipt: PendingBattle | null
}
const key = 'lumemon.qa.online.v1'
const saved = JSON.parse(localStorage.getItem(key) ?? 'null') as State | null
let state: State = saved ?? { session: null, revision: 0, status: 'active', receipt: null }
function view() {
  const s = state.session
  return {
    user_id: user,
    version: 'lumemon-online-v1' as const,
    coins: 0,
    owned: team.slice(0, 6).map((card_id) => ({ card_id, quantity: 1 })),
    match: s
      ? {
          id: s.battle.battleId,
          revision: state.revision,
          status: state.status,
          reward: 0,
          session: { battle: s.battle, opponentId: s.opponentId, rounds: s.rounds },
        }
      : null,
    receipt: state.receipt,
  }
}
const store = createOnlineStore(
  {
    async exchange(r) {
      if (r.kind === 'load') return view()
      if (state.receipt?.requestId === r.requestId) {
        if (!sameCommand(state.receipt.command, r.command))
          throw new BattleFailure('request_conflict')
        return view()
      }
      const c = r.command
      if (c.kind === 'start') {
        state = {
          session: createPractice(r.requestId, c.cardIds, false, 'rookie', [], []),
          revision: 0,
          status: 'active',
          receipt: r,
        }
      } else {
        if (
          !state.session ||
          state.session.battle.battleId !== c.battleId ||
          state.revision !== c.expectedRevision
        )
          throw new BattleFailure('battle_conflict')
        if (c.kind === 'abandon') state.status = 'abandoned'
        else {
          const base = { battleId: c.battleId, expectedVersion: state.session.battle.version }
          state.session = practiceReducer(
            state.session,
            c.kind === 'turn'
              ? { ...base, kind: 'turn', action: c.action, tieBreak: 0 }
              : { ...base, kind: 'replace', targetId: c.targetId },
          )!
          if (state.session.battle.phase === 'finished') state.status = 'finished'
        }
        state.revision++
        state.receipt = r
      }
      localStorage.setItem(key, JSON.stringify(state))
      return view()
    },
  },
  battleStorage(user),
)
createRoot(document.getElementById('root')!).render(
  <MemoryRouter>
    <AppShell>
      <div className="practice-page page-width">
        <p role="note">
          PRUEBA LOCAL DE INTERFAZ · progreso simulado · sin cuentas ni monedas reales
        </p>
        <OnlineBattleScreen store={store} />
      </div>
    </AppShell>
  </MemoryRouter>,
)
