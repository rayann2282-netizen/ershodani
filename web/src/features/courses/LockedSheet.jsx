import { Link, useLocation, useNavigate, useOutletContext, useParams } from 'react-router'
import { CheckIcon, LockIcon } from '../../components/Icons.jsx'
import { COURSES, courseName } from '../../data/studyPlan.js'
import { ar, courseCode } from '../../lib/format.js'

// النافذة اللي تطلع من تحت لما يضغط على مادة مقفلة.
// useOutletContext = ناخذ الخطة من الشاشة اللي ورانا (PlanScreen).
export default function LockedSheet() {
  const { code } = useParams()
  const { plan } = useOutletContext()
  const navigate = useNavigate()
  const location = useLocation()
  const backTo = `/plan${location.search}`

  const item = plan.locked.find((l) => l.key === code)
  if (!item) return null

  const blocker = plan.late.find((l) => item.blockedBy.includes(l.key))
  const blockerName = courseName(item.blockedBy[0])
  const unlocks = blocker ? blocker.locks.map(courseName) : [courseName(item.key)]
  const verb = blocker?.reason === 'withdrawn' ? `حذفت ${blockerName}` : `لم تتجاوز ${blockerName}`

  return (
    <div className="scrim" onClick={() => navigate(backTo)}>
      <section role="dialog" aria-modal="true" aria-label={`${courseName(item.key)} مقفلة عليك`} className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <div className="stack">
          <div className="eyebrow muted" style={{ fontWeight: 600 }}><LockIcon /> مقفلة عليك هالترم</div>
          <h2 className="title">{courseName(item.key)}</h2>
          <div className="caption muted">{courseCode(item.key)} · {ar(COURSES[item.key]?.hours ?? 0)} ساعات</div>
        </div>

        <div className="inset">
          <div className="caption muted" style={{ padding: 'var(--space-2) var(--space-2) var(--space-1)' }}>متطلباتها السابقة</div>
          {(COURSES[item.key]?.prereqs ?? []).map((p, i, all) => {
            const missing = item.blockedBy.includes(p)
            return (
              <div key={p} className="row" style={{ paddingInline: 'var(--space-2)', borderBlockEnd: i === all.length - 1 ? 0 : undefined, color: missing ? undefined : 'var(--color-text-2)' }}>
                {missing ? <span className="chain__dot" /> : <CheckIcon />}
                <span className={missing ? 'bold' : undefined}>{courseName(p)}</span>
                <span className="row__end caption" style={missing ? { color: 'var(--color-accent)', fontWeight: 600 } : undefined}>{missing ? 'ناقصتك' : 'خالصة'}</span>
              </div>
            )
          })}
        </div>

        <p className="soft">
          {verb}، فتقفلت عليك هذي المادة. سجّلها هالترم: إذا نجحت فيها، تنفتح لك {unlocks.join(' و')} الترم اللي بعده، وما تتأخر.
        </p>

        <Link to={backTo} className="btn btn--primary">تمام، فهمت</Link>
      </section>
    </div>
  )
}
