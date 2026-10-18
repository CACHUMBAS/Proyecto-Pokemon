import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { validatePracticeTeam } from '../../battle/practice-team'
import type { PracticeTeamIssue, PracticeTeamTransfer } from '../../battle/practice-team'
import { Button } from '../../components/ui/Button'
import './TeamTransfer.css'

function TeamIssues({ issues }: { issues: readonly PracticeTeamIssue[] }) {
  const { t } = useTranslation()
  return (
    <ul className="team-transfer-issues">
      {issues.map((issue, index) => (
        <li key={index}>
          {t('teamPractice.issues.' + issue.code, {
            ...issue,
            slot: 'slot' in issue ? issue.slot + 1 : undefined,
          })}
        </li>
      ))}
    </ul>
  )
}

export function TeamPracticeLink({ cardIds }: { cardIds: readonly string[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ready = validatePracticeTeam(cardIds)
  return (
    <section className="team-transfer" aria-labelledby="team-practice-title">
      <div>
        <h2 id="team-practice-title">{t('teamPractice.title')}</h2>
        <p>{t('teamPractice.description')}</p>
        <div role="status">
          {ready.valid ? (
            <p className="team-transfer-ready">{t('teamPractice.ready')}</p>
          ) : (
            <TeamIssues issues={ready.issues} />
          )}
        </div>
      </div>
      <Button
        disabled={!ready.valid}
        onClick={() => {
          if (ready.valid)
            navigate('/practica', {
              state: { kind: 'lumemon-practice-team', version: 1, cardIds: ready.cardIds },
            })
        }}
      >
        {t('teamPractice.action')} <span aria-hidden="true">↗</span>
      </Button>
    </section>
  )
}

export function TeamTransferNotice({ transfer }: { transfer: PracticeTeamTransfer }) {
  const { t } = useTranslation()
  if (transfer.kind === 'none') return null
  return (
    <section className="team-transfer" aria-labelledby="team-transfer-title">
      <div role={transfer.kind === 'invalid' ? 'alert' : 'status'}>
        <h2 id="team-transfer-title">
          {t(transfer.kind === 'ready' ? 'teamPractice.loaded' : 'teamPractice.invalid')}
        </h2>
        <p>{t(transfer.kind === 'ready' ? 'teamPractice.copyNote' : 'teamPractice.invalidNote')}</p>
        {transfer.kind === 'invalid' && <TeamIssues issues={transfer.issues} />}
      </div>
      <Link className="team-transfer-back" to="/equipo">
        {t('teamPractice.back')}
      </Link>
    </section>
  )
}
