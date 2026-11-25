import { useState } from 'react'
import { Link } from 'react-router'
import { BackHeader } from '../../components/BackHeader.jsx'
import { useStudent } from '../courses/StudentContext.jsx'
import { buildPlan } from '../courses/plan.js'
import { requiredGpa, encouragement, GPA_MAX } from './gpa.js'
import { ar, parseNumber } from '../../lib/format.js'

const STEP = 0.25

// كل الأرقام تجي من ملفاته، بس الطالب يقدر يعدّلها بيده.
// نحفظها كنص (string) عشان يقدر يكتب «٣٫» وهو في نص الكتابة بدون ما يتلخبط.
export default function GpaScreen() {
  const { student, chosenElectives, gpaInputs, setGpaInputs, maxHours } = useStudent()
  const fromFiles = {
    current: ar(student.summary.cumulativeGpa ?? 0, 2),
    earned: ar(student.summary.earnedHours),
    planned: ar(buildPlan({ student, chosenElectives, maxHours }).totalHours),
  }
  // نبدأ من المحفوظ، واللي ما انحفظ ناخذه من الملفات.
  const [form, setFormState] = useState({
    current: gpaInputs?.current ?? fromFiles.current,
    earned: gpaInputs?.earned ?? fromFiles.earned,
    planned: gpaInputs?.planned ?? fromFiles.planned,
    target: gpaInputs?.target ?? ar(4, 2),
  })

  // كل تعديل ينحفظ. الحقل اللي يساوي رقم الملفات نحفظه null عشان يتحدّث لو تغيّرت الملفات.
  function setForm(next) {
    setFormState(next)
    const keep = (k) => (next[k] === fromFiles[k] ? null : next[k])
    setGpaInputs({ current: keep('current'), earned: keep('earned'), planned: keep('planned'), target: next.target })
  }
  const edited = form.current !== fromFiles.current || form.earned !== fromFiles.earned || form.planned !== fromFiles.planned

  const current = parseNumber(form.current)
  const earned = parseNumber(form.earned)
  const planned = parseNumber(form.planned)
  const target = parseNumber(form.target)

  // التحقق: المعدل بين ٠ و٥، والساعات الجديدة أكبر من صفر.
  const errors = {
    target: target === null || target < 0 || target > GPA_MAX ? 'الهدف لازم يكون بين ٠ و٥' : null,
    current: current === null || current < 0 || current > GPA_MAX ? 'المعدل لازم يكون بين ٠ و٥' : null,
    earned: earned === null || earned < 0 ? 'اكتب عدد الساعات (صفر أو أكثر)' : null,
    planned: planned === null || planned <= 0 ? 'لازم تكون أكبر من صفر' : null,
  }
  const valid = !Object.values(errors).some(Boolean)
  const result = valid ? requiredGpa({ current, earnedHours: earned, plannedHours: planned, target }) : null
  const impossible = result?.status === 'impossible'

  const note = !valid
    ? 'صحّح الأرقام اللي تحت عشان نحسب لك.'
    : {
        ok: `عشان يصير معدلك ${ar(target, 2)} بعد هالترم، لازم تجيب ${ar(result.required ?? 0, 2)} أو أكثر في الـ ${ar(planned)} ساعة.`,
        done: 'هدفك محقق أصلاً. أي معدل هالترم يخليك فوقه.',
        impossible: `حتى لو جبت ٥ كاملة هالترم، أعلى معدل توصله ${ar(result.maxReach, 2)}. نزّل هدفك أو وزّعه على ترمين.`,
      }[result.status]

  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const stepTarget = (delta) => {
    const base = target ?? 4
    const next = Math.min(GPA_MAX, Math.max(0, Math.round((base + delta) / STEP) * STEP))
    setForm({ ...form, target: ar(next, 2) })
  }

  return (
    <main className="screen">
      <BackHeader to="/plan" label="رجوع لخطتك"><span className="muted">خطتك</span></BackHeader>

      <div className="stack" aria-live="polite">
        <h1 className="title">المعدل اللي تحتاجه هالترم</h1>
        <div className="hero-number" style={{ gap: 'var(--space-1)' }}>
          <span className={impossible ? 'display warn' : 'display'}>{!valid ? '؟' : impossible ? 'ما يمديك' : ar(result.required ?? 0, 2)}</span>
          <span className="title title--light muted">من ٥</span>
        </div>
        <p className={impossible || !valid ? 'warn' : 'muted'}>{note}</p>
        {/* كلمة تشجيع: بس لما فيه رقم مطلوب (المحقق والمستحيل لهم كلامهم فوق). */}
        {result?.status === 'ok' && <p className="semibold">{encouragement({ ...result, current }).text}</p>}
      </div>

      <div className="card stack--2">
        <label htmlFor="target" className="section-label" style={{ paddingBlockStart: 0 }}>هدفك التراكمي بعد هالترم</label>
        <div className="stepper">
          <button type="button" className="stepper__btn" aria-label="نقّص الهدف ٠٫٢٥" onClick={() => stepTarget(-STEP)}>−</button>
          <input id="target" className="stepper__input title" inputMode="decimal" value={form.target} onChange={set('target')} aria-invalid={Boolean(errors.target)} aria-describedby={errors.target ? 'target-error' : undefined} />
          <button type="button" className="stepper__btn" aria-label="زوّد الهدف ٠٫٢٥" onClick={() => stepTarget(STEP)}>+</button>
        </div>
        {errors.target && <div id="target-error" className="caption warn">{errors.target}</div>}
      </div>

      <div className="stack" style={{ gap: 0 }}>
        <div className="section-label" style={{ paddingBlockEnd: 'var(--space-1)' }}>من ملفاتك · تقدر تعدّلها</div>
        <NumberRow id="current" label="معدلك التراكمي الحين" value={form.current} onChange={set('current')} error={errors.current} />
        <NumberRow id="earned" label="ساعاتك المجتازة" value={form.earned} onChange={set('earned')} error={errors.earned} unit="ساعة" />
        <NumberRow id="planned" label="ساعات خطتك هالترم" value={form.planned} onChange={set('planned')} error={errors.planned} unit="ساعة" />
        {edited && (
          <button type="button" className="link" onClick={() => setForm({ ...fromFiles, target: form.target })}>رجّع أرقام ملفاتك</button>
        )}
      </div>

      <div className="footer">
        <Link to="/plan" className="btn btn--primary">ارجع لخطتي</Link>
      </div>
    </main>
  )
}

// صف فيه اسم الرقم، وحقل صغير يكتب فيه.
function NumberRow({ id, label, value, onChange, error, unit }) {
  return (
    <div className="row row--pad" style={{ flexWrap: 'wrap' }}>
      <label htmlFor={id}>{label}</label>
      <span className="row__end number-field">
        <input id={id} inputMode="decimal" value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        {unit && <span className="muted">{unit}</span>}
      </span>
      {error && <div id={`${id}-error`} className="caption warn" style={{ flexBasis: '100%' }}>{error}</div>}
    </div>
  )
}
