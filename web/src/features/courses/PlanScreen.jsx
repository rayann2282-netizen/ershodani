import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useSearchParams } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { AlertIcon, CheckIcon, LockIcon, Spinner } from '../../components/Icons.jsx'
import { useStudent } from './StudentContext.jsx'
import { buildPlan } from './plan.js'
import { studentForState } from '../../data/mockStudents.js'
import { courseName } from '../../data/studyPlan.js'
import { ar, coursesCount, courseCode, hoursCount, hoursShort } from '../../lib/format.js'

// الحالات: ?state=loading | empty | full | save-error | saved | withdrawn | in-progress
const DATA_STATES = ['withdrawn', 'in-progress', 'full', 'empty']
const FULL_ELECTIVES = ['ذاع 1001', 'دار 1001']

const LATE_REASON = {
  failed: 'لم تتجاوزها · سجّلها هالترم عشان ما تتأخر',
  withdrawn: 'حذفتها الترم اللي فات (ع) · سجّلها هالترم عشان ما تتأخر',
  not_registered: 'متطلب جامعي ما سجلته',
}

// السطر الصغير تحت المادة المتأخرة لما تكون صف عادي (ما تقفل شي).
const SHORT_REASON = {
  failed: () => 'لم تتجاوزها',
  withdrawn: () => 'حذفتها (ع)',
  not_registered: (key) => `${courseCode(key)} · متطلب جامعي ما سجلته`,
}

export default function PlanScreen() {
  const [params] = useSearchParams()
  const location = useLocation()
  const state = params.get('state')
  const ctx = useStudent()

  const student = DATA_STATES.includes(state) ? studentForState(state) : ctx.student
  const chosen = state === 'full' ? FULL_ELECTIVES : ctx.chosenElectives
  const [deferred, setDeferred] = useState([])
  const plan = buildPlan({ student, chosenElectives: chosen, deferred })

  // حفظ الصورة: idle ← loading ← done (أو error). الحفظ الحقيقي يجي مع الباك اند.
  const [save, setSave] = useState(state === 'saved' ? 'done' : state === 'save-error' ? 'error' : 'idle')
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function handleSave() {
    if (save === 'loading') return
    setSave('loading')
    timers.current.push(
      setTimeout(() => {
        setSave('done')
        timers.current.push(setTimeout(() => setSave('idle'), 2400))
      }, 1100),
    )
  }

  if (state === 'loading') return <PlanLoading />
  if (plan.isEmpty) return <PlanEmpty />

  // سبب القفل: «بسبب كفاءات الإدارة» أو «لأنك حذفت كفاءات الإدارة».
  const lockReason = (blockedBy) => {
    const blocker = plan.late.find((l) => blockedBy.includes(l.key))
    const name = courseName(blockedBy[0])
    return blocker?.reason === 'withdrawn' ? `لأنك حذفت ${name}` : `بسبب ${name}`
  }

  return (
    <main className="screen" style={{ gap: 'var(--space-1)' }}>
      <header className="header">
        <LogoLockup />
      </header>

      <div className={save === 'done' ? 'snap stack' : 'stack'} style={{ gap: 0, borderRadius: 'var(--radius-card)' }}>
        <div className="muted" style={{ fontWeight: 500 }}>خطتك للترم الجاي</div>
        <div className="hero-number">
          <span className="display">{coursesCount(plan.courseCount)}</span>
          <span className={plan.overBy ? 'title warn' : 'title title--light muted'}>
            {ar(plan.totalHours)} من {ar(plan.maxHours)} ساعة
          </span>
        </div>
      </div>

      {plan.overBy > 0 && (
        <div role="alert" className="alert">
          <div className="alert__title">زادت {hoursCount(plan.overBy)} عن الحد</div>
          <div className="alert__body">
            الحد {ar(plan.maxHours)} ساعة.
            {plan.deferSuggestion && ` نقترح تأجّل «${courseName(plan.deferSuggestion)}» للترم اللي بعده، لأنها ما تقفل عليك أي مادة إجبارية.`}
          </div>
        </div>
      )}

      <div className="stack grow" style={{ gap: 0 }}>
        {plan.late.length > 0 && <div className="section-label" style={{ paddingBlock: 'var(--space-1)' }}>متأخرة عليك · خذها أول</div>}
        {plan.late.map((c) =>
          c.locks.length > 0 ? (
            <div key={c.key} className="card">
              <div className="row" style={{ border: 0, minHeight: 0 }}>
                <span className="bold">{courseName(c.key)}</span>
                <span className="badge">أولوية</span>
                <span className="row__end">{hoursShort(c.hours)}</span>
              </div>
              <div className="caption soft">{LATE_REASON[c.reason]}</div>
              <div className="chain" aria-label={`قفلت عليك: ${c.locks.map(courseName).join('، ')}`}>
                <span className="chain__dot" />
                {c.locks.map((k) => (
                  <span key={k} style={{ display: 'contents' }}>
                    <span className="chain__line" />
                    <span className="chip">{courseName(k)}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div key={c.key} className="row row--pad">
              <span className="row__main">
                <span>{courseName(c.key)}</span>
                <span className="caption muted">{SHORT_REASON[c.reason](c.key)}</span>
              </span>
              {plan.deferSuggestion === c.key && <span className="caption warn semibold">نقترح تأجيلها</span>}
              <span className="row__end">{hoursShort(c.hours)}</span>
            </div>
          ),
        )}

        {plan.eligible.length > 0 && <div className="section-label">المستوى {ar(student.currentLevel.level)} في مسارك</div>}
        {plan.eligible.map((c) => (
          <div key={c.key} className="row row--pad">
            <span className="row__main">
              <span>{courseName(c.key)}</span>
              {c.conditionalOn.length > 0 && <span className="caption muted">تنفتح لك إذا تجاوزت «{courseName(c.conditionalOn[0])}» هالترم</span>}
            </span>
            <span className="row__end">{hoursShort(c.hours)}</span>
          </div>
        ))}

        {plan.electives.length > 0 && <div className="section-label">متطلبات اخترتها</div>}
        {plan.electives.map((c) => (
          <div key={c.key} className="row">
            <span>{courseName(c.key)}</span>
            {plan.deferSuggestion === c.key && <span className="caption warn semibold">نقترح تأجيلها</span>}
            <span className="row__end">{hoursShort(c.hours)}</span>
          </div>
        ))}

        {plan.remainingHours > 0 && !plan.overBy && (
          <Link to="/electives" className="dashed-add">
            <span className="plus">+</span>
            <span className="semibold">باقي لك {hoursCount(plan.remainingHours)}</span>
            <span className="row__end caption">اختر متطلباتك</span>
          </Link>
        )}

        {plan.locked.length > 0 && <div className="section-label">مقفلة عليك هالترم ({ar(plan.locked.length)})</div>}
        {plan.locked.map((c) => (
          <Link key={c.key} to={`locked/${encodeURIComponent(c.key)}${location.search}`} className="row row--locked">
            <LockIcon />
            <span>{courseName(c.key)}</span>
            <span className="row__end">{lockReason(c.blockedBy)}</span>
          </Link>
        ))}
      </div>

      {save === 'error' && (
        <div role="alert" className="alert">
          <div className="alert__title"><span className="warn"><AlertIcon size={18} /></span>ما انحفظت الصورة</div>
          <div className="alert__body">المتصفح ما سمح لنا نوصل لصورك. اضغط «جرّب مرة ثانية» واختر «سماح» لما يسألك، أو خذ لقطة شاشة لهالصفحة.</div>
        </div>
      )}
      {save === 'done' && (
        <div role="status" className="card" style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="row__main">
            <span className="bold">تلقاها في الصور</span>
            <span className="caption muted">باسم <span dir="ltr">«ershodani-plan-1448-2.png»</span>. افتحها يوم التسجيل وسجّل منها.</span>
          </span>
        </div>
      )}

      <div className="footer" style={{ paddingBlockStart: 'var(--space-1)' }}>
        {plan.overBy > 0 ? (
          <>
            {plan.deferSuggestion && (
              <button type="button" className="btn btn--primary" onClick={() => setDeferred([...deferred, plan.deferSuggestion])}>
                أجّلها · تصير {ar(plan.totalHours - courseHoursOf(plan, plan.deferSuggestion))} ساعة
              </button>
            )}
            <button type="button" className="btn btn--secondary">أختار بنفسي وش أشيل</button>
          </>
        ) : (
          <>
            <button type="button" className={save === 'loading' ? 'btn btn--loading' : 'btn btn--primary'} onClick={handleSave} aria-live="polite">
              {save === 'loading' && <Spinner />}
              {save === 'done' && <CheckIcon size={20} width={3} className="pop" />}
              {{ loading: 'نجهّز الصورة…', done: 'انحفظت في صورك', error: 'جرّب مرة ثانية' }[save] ?? 'احفظ خطتي صورة'}
            </button>
            {save === 'error' ? (
              <button type="button" className="btn btn--secondary">انسخ خطتي كنص</button>
            ) : (
              <Link to="/gpa" className="btn btn--secondary">احسب المعدل اللي تحتاجه</Link>
            )}
          </>
        )}
      </div>

      {/* نافذة «مادة مقفلة» تطلع هنا فوق الخطة */}
      <Outlet context={{ plan, student }} />
    </main>
  )
}

// ساعات مادة من الخطة نفسها (متأخرة أو متاحة أو متطلب).
function courseHoursOf(plan, key) {
  return [...plan.late, ...plan.eligible, ...plan.electives].find((c) => c.key === key)?.hours ?? 0
}

function PlanLoading() {
  return (
    <main className="screen" role="status" aria-label="نرتب خطتك">
      <header className="header">
        <LogoLockup />
      </header>
      <div className="stack">
        <div className="muted">نرتب خطتك…</div>
        <div className="skeleton" style={{ width: '50%', height: 'var(--size-button)' }} />
        <div className="caption muted">نطابق ٢٧ مادة باقية مع متطلباتها السابقة</div>
      </div>
      <div className="stack grow">
        <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-card)' }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 'var(--space-4)' }} />
        ))}
      </div>
      <button type="button" className="btn" disabled>احفظ خطتي صورة</button>
    </main>
  )
}

function PlanEmpty() {
  return (
    <main className="screen">
      <header className="header">
        <LogoLockup />
      </header>
      <div className="stack stack--2 grow" style={{ justifyContent: 'center' }}>
        <div className="radio radio--on" style={{ width: 64, height: 64, borderRadius: 32, background: 'transparent', border: '2px solid var(--color-accent)', color: 'var(--color-accent)' }}>
          <CheckIcon size={28} />
        </div>
        <h1 className="display">خلصت خطتك كاملة</h1>
        <p className="muted">ما باقي عليك ولا مادة في كشف المقررات المتبقية. الخطوة الجاية: قدّم طلب التخرج من بوابة الجامعة.</p>
      </div>
      <div className="footer">
        {/* [?] رابط بوابة الجامعة: نضيفه لما نتأكد منه */}
        <button type="button" className="btn btn--primary">افتح بوابة الجامعة</button>
        <Link to="/gpa" className="btn btn--secondary">احسب معدلك النهائي</Link>
      </div>
    </main>
  )
}
