import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BackHeader, Steps } from '../../components/BackHeader.jsx'
import { CheckIcon, ChevronDownIcon } from '../../components/Icons.jsx'
import { useStudent } from './StudentContext.jsx'
import { gradeStatus } from './plan.js'
import { courseName, EQUIVALENTS } from '../../data/studyPlan.js'
import { ar, courseCode, coursesCount } from '../../lib/format.js'

const REASON = { failed: 'لم تتجاوزها', withdrawn: 'حذفتها' }

// ?state=empty → أول ترم (الجامعة تسجّل مواد المستوى الأول تلقائياً).
export default function ConfirmScreen() {
  const [params] = useSearchParams()
  const { student, hasRecord, markedPassed, setMarkedPassed } = useStudent()

  const [showPassed, setShowPassed] = useState(false)
  const notPassed = student.transcript.filter((t) => ['failed', 'withdrawn'].includes(gradeStatus(t.grade)))
  const passed = student.transcript.filter((t) => gradeStatus(t.grade) === 'passed')
  // البيانات الحقيقية تحسب «لا، خلصتها» من نفسها؛ الطالب الوهمي لا.
  const passedCount = hasRecord ? student.summary.passedCount : student.summary.passedCount + markedPassed.length
  const isEmpty = params.get('state') === 'empty' || (hasRecord && passedCount === 0)

  function markAsPassed(course) {
    setMarkedPassed([...markedPassed, course])
  }

  return (
    <main className="screen">
      <BackHeader to="/upload">
        <Steps step={2} />
      </BackHeader>

      {isEmpty ? (
        <>
          <div className="stack">
            <h1 className="display">أول ترم لك؟</h1>
            <p className="muted">ما لقينا ولا مادة خالصة في سجلك. في أول ترم، الجامعة تسجّل لك مواد المستوى الأول تلقائياً، فما تحتاج تسوي شي الحين. ارجع لنا قبل تسجيل الترم الثاني.</p>
          </div>
          <FileChecks name={<bdi dir="ltr">Faisal Al-Harbi</bdi>} transcriptNote="ما فيه درجات للحين" />
          <div className="grow">
            <div className="card">
              <span className="bold">خطأ؟ خلصت مواد وما طلعت؟</span>
              <span className="caption muted">يمكن رفعت سجل قديم. نزّل نسخة جديدة من البوابة، أو ضيف موادك بيدك.</span>
              <button type="button" className="link semibold" style={{ color: 'var(--color-text)' }}>ضيف مادة خلصتها</button>
            </div>
          </div>
          <Link to="/login" className="btn btn--primary">تمام، بتجينا قبل الترم الثاني</Link>
        </>
      ) : (
        <>
          <div className="stack">
            <h1 className="display">خلصت {coursesCount(passedCount)}</h1>
            <p className="muted">قرينا الملفين. راجعها بسرعة قبل ما نرتب خطتك.</p>
          </div>
          <FileChecks
            name={student.fullName ?? `${coursesCount(student.currentLevel.courses.length + student.mandatoryUniversity.length)} باقية لترمك الجاي`}
            transcriptNote={student.summary.cumulativeGpa === null ? 'ما فيه معدل للحين' : `المعدل ${ar(student.summary.cumulativeGpa, 2)} من ٥`}
          />

          <div className="grow stack stack--2">
            <button type="button" className="btn btn--secondary" aria-expanded={showPassed} aria-controls="passed-list" onClick={() => setShowPassed(!showPassed)} style={{ justifyContent: 'flex-start', paddingInline: 'var(--space-2)', border: 0, background: 'var(--color-surface)', height: 'var(--size-button)' }}>
              <span className="bold">خلصتها</span>
              <span className="muted" style={{ fontWeight: 400 }}>{coursesCount(passedCount)} · {ar(student.summary.earnedHours)} ساعة</span>
              <span className="row__end" style={{ display: 'flex', transform: showPassed ? 'rotate(180deg)' : undefined }}><ChevronDownIcon /></span>
            </button>

            {/* القائمة اللي يأكدها الطالب: كل مادة تجاوزها، باسمها ورمزها وتقديره. */}
            {showPassed && (
              <section id="passed-list" className="card card--flush" aria-label="مواد خلصتها">
                {passed.map((t) => (
                  <div key={t.course} className="row row--pad" style={{ paddingInline: 'var(--space-2)' }}>
                    <span className="row__main">
                      <span>{courseName(EQUIVALENTS[t.course] ?? t.course)}</span>
                      <span className="caption muted">{courseCode(t.course)}</span>
                    </span>
                    <span className="row__end caption muted">{t.grade}</span>
                  </div>
                ))}
              </section>
            )}

            {notPassed.length > 0 && (
              <section className="card card--flush" aria-label="مواد ما خلصتها">
                <div className="row" style={{ paddingInline: 'var(--space-2)' }}>
                  <span className="bold">ما خلصتها</span>
                  <span className="caption muted">بتنضاف لخطتك</span>
                </div>
                {notPassed.map((t) => (
                  <div key={t.course} className="row row--pad" style={{ paddingInline: 'var(--space-2)', borderBlockEnd: 0 }}>
                    <span className="row__main">
                      <span>{courseName(t.course)}</span>
                      <span className="caption muted">{courseCode(t.course)} · {REASON[gradeStatus(t.grade)]} ({t.grade})</span>
                    </span>
                    <button type="button" className="btn btn--secondary btn--small row__end" style={{ color: 'var(--color-text)' }} onClick={() => markAsPassed(t.course)}>لا، خلصتها</button>
                  </div>
                ))}
              </section>
            )}
          </div>

          <Link to="/plan" className="btn btn--primary">صح، اعرض خطتي</Link>
        </>
      )}
    </main>
  )
}

function FileChecks({ name, transcriptNote }) {
  return (
    <div className="stack caption muted">
      <div className="eyebrow" style={{ fontWeight: 400 }}><CheckIcon /> <span>كشف المقررات المتبقية · {name}</span></div>
      <div className="eyebrow" style={{ fontWeight: 400 }}><CheckIcon /> <span>السجل الأكاديمي · {transcriptNote}</span></div>
    </div>
  )
}
