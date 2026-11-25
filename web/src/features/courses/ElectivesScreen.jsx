import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BackHeader } from '../../components/BackHeader.jsx'
import { CheckIcon } from '../../components/Icons.jsx'
import { useStudent } from './StudentContext.jsx'
import { buildPlan, openGroups } from './plan.js'
import { courseName, UNIVERSITY_COURSE_HOURS } from '../../data/studyPlan.js'
import { ar, courseCode, coursesCount } from '../../lib/format.js'

// الحالات: ?state=full (وصل الحد) | empty (كمّل كل الأقسام)
const FULL_PICKS = ['ذاع 1001', 'دار 1001']

export default function ElectivesScreen() {
  const [params] = useSearchParams()
  const state = params.get('state')
  const navigate = useNavigate()
  const { student, chosenElectives, setChosenElectives, maxHours } = useStudent()

  // الساعات المتاحة = الحد ناقص الخطة بدون متطلبات.
  const basePlan = buildPlan({ student, maxHours })
  const cap = basePlan.remainingHours
  const groups = state === 'empty' ? [] : openGroups(student.groups)
  const doneGroups = student.groups.filter((g) => g.passed >= g.required).map((g) => ar(g.name))
  const [picked, setPicked] = useState(state === 'full' ? FULL_PICKS : chosenElectives)
  const usedHours = picked.length * UNIVERSITY_COURSE_HOURS
  const atCap = usedHours + UNIVERSITY_COURSE_HOURS > cap

  function toggle(key, group) {
    if (picked.includes(key)) return setPicked(picked.filter((k) => k !== key))
    const inGroup = picked.filter((k) => group.options.includes(k)).length
    if (inGroup >= group.remaining || atCap) return // القسم مكتمل أو وصلت الحد
    setPicked([...picked, key])
  }

  function confirm() {
    setChosenElectives(picked)
    navigate('/plan')
  }

  if (groups.length === 0) {
    return (
      <main className="screen">
        <BackHeader to="/plan" label="رجوع لخطتك"><span className="muted">خطتك</span></BackHeader>
        <div className="stack stack--2 grow" style={{ justifyContent: 'center' }}>
          <h1 className="display">كمّلت متطلباتك الجامعية</h1>
          <p className="muted">ما باقي لك قسم تختار منه. خطتك تبقى {ar(basePlan.totalHours)} ساعة، وهذا تحت الحد وما يأخرك عن التخرج.</p>
        </div>
        <Link to="/plan" className="btn btn--primary">ارجع لخطتي</Link>
      </main>
    )
  }

  return (
    <main className="screen" style={{ gap: 'var(--space-2)' }}>
      <BackHeader to="/plan" label="رجوع لخطتك"><span className="muted">خطتك</span></BackHeader>

      <div className="stack">
        <h1 className="title">اختر متطلباتك</h1>
        <div className="hero-number" style={{ gap: 'var(--space-1)' }}>
          <span className="display">{ar(usedHours)}</span>
          <span className="title title--light muted">من {ar(cap)} ساعات</span>
        </div>
        <div className="caption" role="status" style={{ color: atCap && picked.length ? 'var(--color-text)' : 'var(--color-text-2)' }}>
          {atCap && picked.length ? `وصلت حد الـ ${ar(basePlan.maxHours)} ساعة. تبي مادة ثانية؟ شيل اختيار من فوق أول.` : 'نعرض لك بس الأقسام اللي ما كمّلتها'}
        </div>
      </div>

      <div className="stack grow">
        {groups.map((g) => {
          const inGroup = picked.filter((k) => g.options.includes(k)).length
          const groupDone = inGroup >= g.remaining
          return (
            <section key={g.name} className="card card--flush" style={{ paddingBlockEnd: 'var(--space-1)' }} aria-label={g.name}>
              <div className="card__head">
                <span className="bold">{ar(g.name)}</span>
                <span className="row__end caption">{groupDone ? 'كمّلته' : `باقي ${ar(g.remaining - inGroup)} من ${ar(g.required)}`}</span>
              </div>
              {g.options.map((key) => {
                const on = picked.includes(key)
                const disabled = !on && (groupDone || atCap)
                return (
                  <button key={key} type="button" className="option" aria-pressed={on} disabled={disabled} onClick={() => toggle(key, g)}>
                    <span className={on ? 'radio radio--on' : 'radio'}>{on && <CheckIcon size={14} width={3.5} />}</span>
                    <span className={on ? 'semibold' : undefined} style={on ? { color: 'var(--color-text)' } : undefined}>{courseName(key)}</span>
                    <span className="option__end">{courseCode(key)}</span>
                  </button>
                )
              })}
            </section>
          )
        })}
        {doneGroups.length > 0 && <div className="caption muted">كمّلت: {doneGroups.join(' · ')}</div>}
      </div>

      <button type="button" className="btn btn--primary" disabled={picked.length === 0} onClick={confirm}>
        {picked.length === 0 ? 'اختر مادة وحدة على الأقل' : `ضيف ${coursesCount(picked.length)} لخطتي`}
      </button>
    </main>
  )
}
