import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useSearchParams } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { BackHeader } from '../../components/BackHeader.jsx'
import { SignOutLink } from '../auth/SignOutLink.jsx'
import { AlertIcon, CheckIcon, CloseIcon, LockIcon, Spinner } from '../../components/Icons.jsx'
import { useStudent } from './StudentContext.jsx'
import { LOADS, buildPlan, locksIfRemoved } from './plan.js'
import { studentForState } from '../../data/mockStudents.js'
import { MAX_HOURS, courseName } from '../../data/studyPlan.js'
import { ar, coursesCount, courseCode, hoursCount, hoursShort } from '../../lib/format.js'
import { SELF_SERVICE_URL, TARTEBAH_URL } from '../../lib/links.js'

// الحالات: ?state=loading | empty | full | save-error | saved | withdrawn | in-progress
const DATA_STATES = ['withdrawn', 'in-progress', 'full', 'empty']
const FULL_ELECTIVES = ['ذاع 1001']
const PLAN_IMAGE_NAME = 'ershodani-plan.png'

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
  // المواد اللي شالها (هو أو بزر «أجّلها»). محفوظة في StudentContext عشان المعدل والمتطلبات يشوفونها.
  const deferred = ctx.removed
  const setDeferred = ctx.setRemoved
  const [confirmRemove, setConfirmRemove] = useState(null) // المادة اللي ينتظر تأكيد شيلها
  const plan = buildPlan({ student, chosenElectives: chosen, deferred, maxHours: ctx.maxHours })

  // حفظ الصورة: idle ← loading ← done (أو error).
  // نصوّر الخطة بـ html-to-image (نحمّلها بس لما يضغط الزر)، وبعدها:
  // في الجوال نفتح «مشاركة» عشان يحفظها في الصور، وفي الكمبيوتر تنزل كملف.
  const [save, setSave] = useState(state === 'saved' ? 'done' : state === 'save-error' ? 'error' : 'idle')
  const screenRef = useRef(null)
  const timers = useRef([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  async function handleSave() {
    if (save === 'loading') return
    setSave('loading')
    try {
      const { toBlob } = await import('html-to-image')
      const node = screenRef.current
      node.classList.add('no-motion')
      const blob = await toBlob(node, {
        pixelRatio: 2,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        // الأزرار ورسائل الحفظ ما تطلع في الصورة، بس الخطة.
        filter: (el) => !(el.classList?.contains('footer') || el.classList?.contains('icon-btn') || el.dataset?.noCapture !== undefined),
      })
      const file = new File([blob], PLAN_IMAGE_NAME, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'خطتي للترم الجاي' })
      } else {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = PLAN_IMAGE_NAME
        link.click()
        timers.current.push(setTimeout(() => URL.revokeObjectURL(link.href), 1000))
      }
      setSave('done')
      timers.current.push(setTimeout(() => setSave('idle'), 4000))
    } catch (error) {
      // سكّر نافذة المشاركة بنفسه؟ هذا مو خطأ.
      if (error?.name === 'AbortError') return setSave('idle')
      console.error('[Ershodani] Could not save the plan image:', error)
      setSave('error')
    }
  }

  // نسخة نصية من الخطة، لو الصورة ما زبطت.
  async function copyAsText() {
    const lines = [...plan.late, ...plan.eligible, ...plan.electives].map((c) => `${courseName(c.key)} (${courseCode(c.key)}) · ${hoursShort(c.hours)}`)
    await navigator.clipboard?.writeText(['خطتي للترم الجاي', ...lines, `المجموع: ${ar(plan.totalHours)} ساعة`].join('\n'))
    setSave('idle')
  }

  if (state === 'loading') return <PlanLoading />
  if (plan.isEmpty) return <PlanEmpty />

  // المواد تطلع وحدة ورا الثانية بنفس ترتيبها في الصفحة (--i = رقمها). شوف .rise في styles.css.
  const riseOrder = [...plan.late, ...plan.eligible, ...plan.electives, ...plan.locked].map((c) => c.key)
  const rise = (key) => ({ '--i': riseOrder.indexOf(key) })

  // سبب القفل: «بسبب كفاءات الإدارة»، أو «لأنك حذفت …»، أو «بعد المحاسبة» (متطلبها في خطة هالترم).
  const lockReason = (blockedBy) => {
    const blocker = plan.late.find((l) => blockedBy.includes(l.key))
    const name = courseName(blocker?.key ?? blockedBy[0])
    if (blocker?.reason === 'withdrawn') return `لأنك حذفت ${name}`
    if (!blocker && plan.eligible.some((c) => blockedBy.includes(c.key))) return `بعد ${name}`
    return `بسبب ${name}`
  }

  return (
    <main ref={screenRef} className="screen" style={{ gap: 'var(--space-1)' }}>
      <BackHeader to="/confirm" label="رجوع لتأكيد المواد"><span className="muted">موادك</span></BackHeader>

      <div className={save === 'done' ? 'snap stack' : 'stack'} style={{ gap: 0, borderRadius: 'var(--radius-card)' }}>
        <div className="muted" style={{ fontWeight: 500 }}>خطتك للترم الجاي</div>
        <div className="hero-number">
          <span className="display">{coursesCount(plan.courseCount)}</span>
          <span className={plan.overBy ? 'title warn' : 'title title--light muted'}>
            {ar(plan.totalHours)} من {ar(plan.maxHours)} ساعة
          </span>
        </div>
      </div>

      {/* الحمل: كم ساعة يبي هالترم. ما يطلع في صورة الخطة. */}
      <div className="segmented" role="group" aria-label="كم تبي تشيل هالترم؟" data-no-capture>
        {LOADS.map((l) => (
          <button key={l.key} type="button" className="segmented__btn" aria-pressed={ctx.load === l.key} onClick={() => ctx.setLoad(l.key)}>
            {l.label} · {ar(l.hours)}
          </button>
        ))}
      </div>

      {plan.overBy > 0 && (
        <div role="alert" className="alert">
          <div className="alert__title">زادت {hoursCount(plan.overBy)} عن الحد</div>
          <div className="alert__body">
            الحد {ar(plan.maxHours)} ساعة.
            {plan.deferSuggestion && ` نقترح تأجّل «${courseName(plan.deferSuggestion)}» للترم اللي بعده، لأنها ما تقفل عليك أي مادة إجبارية.`}
            {!plan.deferSuggestion && plan.maxHours < MAX_HOURS && ` مواد مستواك أكثر من الحمل اللي اخترته. اختر حمل أثقل، أو شيل متطلب اخترته.`}
          </div>
        </div>
      )}

      <div className="stack grow" style={{ gap: 0 }}>
        {plan.late.length > 0 && <div className="section-label" style={{ paddingBlock: 'var(--space-1)' }}>متأخرة عليك · خذها أول</div>}
        {plan.late.map((c) =>
          c.locks.length > 0 ? (
            <div key={c.key} className="card rise" style={rise(c.key)}>
              <div className="row" style={{ border: 0, minHeight: 0 }}>
                <span className="bold">{courseName(c.key)}</span>
                <span className="badge">أولوية</span>
                <span className="row__end">{hoursShort(c.hours)}</span>
<RemoveButton name={courseName(c.key)} onClick={() => setConfirmRemove(c.key)} />
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
            <div key={c.key} className="row row--pad rise" style={rise(c.key)}>
              <span className="row__main">
                <span>{courseName(c.key)}</span>
                <span className="caption muted">{SHORT_REASON[c.reason](c.key)}</span>
              </span>
              {plan.deferSuggestion === c.key && <span className="caption warn semibold">نقترح تأجيلها</span>}
              <span className="row__end">{hoursShort(c.hours)}</span>
<RemoveButton name={courseName(c.key)} onClick={() => setConfirmRemove(c.key)} />
            </div>
          ),
        )}

        {/* مواد التخصص مقسومة على المستويات: مستواك، وبعده اللي عبّيناه من المستوى الجاي */}
        {[...new Set(plan.eligible.map((c) => c.level))].map((level) => (
          <div key={level ?? 'none'} style={{ display: 'contents' }}>
            <div className="section-label">
              المستوى {ar(level)} في مسارك{level !== student.currentLevel.level && ' · متطلباتها خالصة'}
            </div>
            {plan.eligible
              .filter((c) => c.level === level)
              .map((c) => (
                <div key={c.key} className="row row--pad rise" style={rise(c.key)}>
                  <span className="row__main">
                    <span>{courseName(c.key)}</span>
                    {c.conditionalOn.length > 0 && <span className="caption muted">تنفتح لك إذا تجاوزت «{courseName(c.conditionalOn[0])}» هالترم</span>}
                  </span>
                  {plan.deferSuggestion === c.key && <span className="caption warn semibold">نقترح تأجيلها</span>}
                  <span className="row__end">{hoursShort(c.hours)}</span>
<RemoveButton name={courseName(c.key)} onClick={() => setConfirmRemove(c.key)} />
                </div>
              ))}
          </div>
        ))}

        {plan.electives.length > 0 && <div className="section-label">متطلبات اخترتها</div>}
        {plan.electives.map((c) => (
          <div key={c.key} className="row rise" style={rise(c.key)}>
            <span>{courseName(c.key)}</span>
            {plan.deferSuggestion === c.key && <span className="caption warn semibold">نقترح تأجيلها</span>}
            <span className="row__end">{hoursShort(c.hours)}</span>
<RemoveButton name={courseName(c.key)} onClick={() => setConfirmRemove(c.key)} />
          </div>
        ))}

        {plan.remainingHours > 0 && !plan.overBy && (
          <Link to="/electives" className="dashed-add" data-no-capture>
            <span className="plus">+</span>
            <span className="semibold">باقي لك {hoursCount(plan.remainingHours)}</span>
            <span className="row__end caption">اختر متطلباتك</span>
          </Link>
        )}

        {plan.locked.length > 0 && <div className="section-label">مقفلة عليك هالترم ({ar(plan.locked.length)})</div>}
        {plan.locked.map((c) => (
          <Link key={c.key} to={`locked/${encodeURIComponent(c.key)}${location.search}`} className="row row--locked rise" style={rise(c.key)}>
            <LockIcon />
            <span>{courseName(c.key)}</span>
            <span className="row__end">{lockReason(c.blockedBy)}</span>
          </Link>
        ))}
      </div>

      {/* اللي شالها: يقدر يرجّعها بضغطة. ما تطلع في صورة الخطة. */}
      {deferred.length > 0 && (
        <section className="card" data-no-capture aria-label="مواد شلتها من خطتك">
          <span className="bold">شلتها من خطتك</span>
          {deferred.map((key) => (
            <div key={key} className="row" style={{ borderBlockEnd: 0, minHeight: 0 }}>
              <span className="muted">{courseName(key)}</span>
              <button type="button" className="link row__end" onClick={() => setDeferred(deferred.filter((k) => k !== key))}>
                رجّعها
              </button>
            </div>
          ))}
        </section>
      )}

      {save === 'error' && (
        <div role="alert" className="alert" data-no-capture>
          <div className="alert__title"><span className="warn"><AlertIcon size={18} /></span>ما انحفظت الصورة</div>
          <div className="alert__body">ما قدرنا نجهّز الصورة. اضغط «جرّب مرة ثانية»، أو انسخ خطتك كنص، أو خذ لقطة شاشة لهالصفحة.</div>
        </div>
      )}
      {save === 'done' && (
        <div role="status" className="card" data-no-capture style={{ flexDirection: 'row', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="row__main">
            <span className="bold">جهزت صورة خطتك</span>
            <span className="caption muted">باسم <span dir="ltr">«{PLAN_IMAGE_NAME}»</span>. افتحها يوم التسجيل وسجّل منها.</span>
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
            {/* يروح لـ«اختر متطلباتك» ويشيل اللي يبيه من هناك. لو ما اختار متطلبات، ما فيه شي يشيله بيده. */}
            {plan.electives.length > 0 && (
              <Link to={`/electives${location.search}`} className="btn btn--secondary">أختار بنفسي وش أشيل</Link>
            )}
          </>
        ) : (
          <>
            <button type="button" className={save === 'loading' ? 'btn btn--loading' : 'btn btn--primary'} onClick={handleSave} aria-live="polite">
              {save === 'loading' && <Spinner />}
              {save === 'done' && <CheckIcon size={20} width={3} className="pop" />}
              {{ loading: 'نجهّز الصورة…', done: 'جهزت الصورة', error: 'جرّب مرة ثانية' }[save] ?? 'احفظ خطتي صورة'}
            </button>
            {save === 'error' ? (
              <button type="button" className="btn btn--secondary" onClick={copyAsText}>انسخ خطتي كنص</button>
            ) : (
              <Link to="/gpa" className="btn btn--secondary">احسب المعدل اللي تحتاجه</Link>
            )}
            {/* بعد ما ضبط موادك وحملك: «ترتيبه» يرتب أوقات الشعب. موقع ثاني، ما نرسل له أي بيانات. */}
            <a href={TARTEBAH_URL} target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
              رتّب جدولك في «ترتيبه» ↗
            </a>
          </>
        )}
        <SignOutLink />
      </div>

      {/* «متأكد تشيلها؟» مع المواد اللي بتتقفل عليه بسببها */}
      {confirmRemove && (
        <ConfirmRemoveSheet
          courseKey={confirmRemove}
          locks={locksIfRemoved(confirmRemove, student)}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={() => {
            setDeferred([...deferred, confirmRemove])
            setConfirmRemove(null)
          }}
        />
      )}

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
      <BackHeader to="/confirm" label="رجوع لتأكيد المواد"><span className="muted">موادك</span></BackHeader>
      <div className="stack stack--2 grow" style={{ justifyContent: 'center' }}>
        <div className="radio radio--on" style={{ width: 64, height: 64, borderRadius: 32, background: 'transparent', border: '2px solid var(--color-accent)', color: 'var(--color-accent)' }}>
          <CheckIcon size={28} />
        </div>
        <h1 className="display">خلصت خطتك كاملة</h1>
        <p className="muted">ما باقي عليك ولا مادة في كشف المقررات المتبقية. الخطوة الجاية: قدّم طلب التخرج من الخدمات الذاتية.</p>
      </div>
      <div className="footer">
        <a href={SELF_SERVICE_URL} target="_blank" rel="noopener noreferrer" className="btn btn--primary">افتح الخدمات الذاتية ↗</a>
        <Link to="/gpa" className="btn btn--secondary">احسب معدلك النهائي</Link>
      </div>
    </main>
  )
}

// زر ✕ صغير آخر صف المادة: يفتح «متأكد؟» قبل ما يشيلها.
function RemoveButton({ name, onClick }) {
  return (
    <button type="button" className="remove-btn" aria-label={`شيل ${name} من خطتك`} onClick={onClick} data-no-capture>
      <CloseIcon />
    </button>
  )
}

// نافذة من تحت: «متأكد تشيل X؟» + المواد اللي بتتقفل. الزر الأساسي «لا، خلّها» لأنه الأأمن.
const SHOW_LOCKS = 6
function ConfirmRemoveSheet({ courseKey, locks, onCancel, onConfirm }) {
  const name = courseName(courseKey)
  return (
    <div className="scrim" onClick={onCancel}>
      <section role="alertdialog" aria-modal="true" aria-label={`متأكد تشيل ${name}؟`} className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet__handle" />
        <h2 className="title">متأكد تشيل «{name}»؟</h2>

        {locks.length > 0 ? (
          <>
            <p className="warn">لو شلتها، بتتقفل عليك {coursesCount(locks.length)} لين تخلّصها:</p>
            <div className="inset">
              {locks.slice(0, SHOW_LOCKS).map((k, i, shown) => (
                <div key={k} className="row" style={{ paddingInline: 'var(--space-2)', borderBlockEnd: i === shown.length - 1 ? 0 : undefined }}>
                  <LockIcon />
                  <span>{courseName(k)}</span>
                  <span className="row__end caption muted">{courseCode(k)}</span>
                </div>
              ))}
              {locks.length > SHOW_LOCKS && (
                <div className="caption muted" style={{ padding: 'var(--space-1) var(--space-2)' }}>وغيرها {coursesCount(locks.length - SHOW_LOCKS)}</div>
              )}
            </div>
            <p className="soft caption">يعني ممكن تتأخر عن التخرج. تقدر ترجّعها بعدين من «شلتها من خطتك».</p>
          </>
        ) : (
          <p className="soft">ما تقفل عليك ولا مادة، بس بتحتاج تسجّلها ترم ثاني. تقدر ترجّعها بعدين من «شلتها من خطتك».</p>
        )}

        <div className="stack">
          <button type="button" className="btn btn--primary" onClick={onCancel} autoFocus>لا، خلّها</button>
          <button type="button" className="btn btn--secondary warn" onClick={onConfirm}>إيه، شيلها</button>
        </div>
      </section>
    </div>
  )
}
