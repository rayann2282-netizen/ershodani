import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { BackHeader, Steps } from '../../components/BackHeader.jsx'
import { AlertIcon, CheckIcon, Spinner, UploadIcon, WifiOffIcon } from '../../components/Icons.jsx'
import { readPortalFiles } from '../upload/readFiles.js'
import { SignOutLink } from '../auth/SignOutLink.jsx'
import { MenuButton } from '../../components/Menu.jsx'
import { hasBeenWelcomed } from '../welcome/welcomed.js'
import { useStudent } from './StudentContext.jsx'

// الطالب يختار الملفين مع بعض. نقرأهم في المتصفح (ما يطلعون من الجوال)، ونحفظ قائمة المواد بس.
// روابط التجربة: ?state=loading | unreadable | missing | offline | other_major

function Slot({ number, title, note, status }) {
  const cls = { done: 'slot slot--done', error: 'slot slot--error', missing: 'slot slot--missing', loading: 'slot slot--done' }[status] ?? 'slot'
  return (
    <div className={cls}>
      <div className="slot__num">
        {status === 'done' && <CheckIcon size={22} />}
        {status === 'loading' && <Spinner size={22} />}
        {(status === 'idle' || status === 'error' || status === 'missing') && number}
      </div>
      <div className="row__main">
        <span className="bold">{title}</span>
        <span className={status === 'error' || status === 'missing' ? 'caption warn' : 'caption muted'}>{note}</span>
      </div>
    </div>
  )
}

const REPORT = 'كشف المقررات المتبقية'
const TRANSCRIPT = 'السجل الأكاديمي'

// كل حالة: العنوان والكلام وحالة الخانتين. `info` فيه تفاصيل الخطأ الحقيقي.
function copyFor(status, info = {}) {
  switch (status) {
    case 'loading':
      return { title: 'حمل الملفات', body: 'ثواني بس. خلّ الصفحة مفتوحة.', slots: [['loading', 'نقرأ الكشف…'], ['loading', 'نقرأ درجاتك…']] }
    case 'unreadable': {
      const isImage = info.reason === 'not_pdf'
      return {
        eyebrow: 'ما قدرنا نقرأ واحد منهم',
        title: isImage ? 'الملف صورة' : 'الملف ما انقرأ',
        fileName: info.fileName ?? 'Screenshot_2026-11-20.png',
        body: isImage
          ? 'صورة، وإحنا نقرأ ملفات PDF بس. نزّل الكشف والسجل من البوابة كـ PDF واخترهم من جديد.'
          : 'مو ملف من البوابة، أو PDF ممسوح بالكاميرا. نزّل الكشف والسجل من البوابة كـ PDF واخترهم من جديد.',
        slots: [['idle', 'نحتاجه PDF من البوابة'], ['idle', 'نحتاجه PDF من البوابة']],
        retry: 'اختر الملفين من جديد',
      }
    }
    case 'missing': {
      const needReport = info.missing === 'remaining_report'
      return {
        eyebrow: 'وصل واحد، باقي واحد',
        title: needReport ? 'ناقصك الكشف' : 'ناقصك السجل',
        body: needReport
          ? `وصلنا ${TRANSCRIPT}. اختر ${REPORT} الحين، عشان نعرف وش باقي عليك.`
          : `وصلنا ${REPORT}. اختر ${TRANSCRIPT} الحين، عشان نضبطك بأحلى جدول.`,
        slots: needReport ? [['missing', 'ما وصل'], ['done', 'وصل']] : [['done', 'وصل'], ['missing', 'ما وصل']],
        retry: needReport ? `اختر ${REPORT}` : `اختر ${TRANSCRIPT}`,
      }
    }
    case 'other_major':
      return {
        eyebrow: 'لسه ما وصلنا تخصصك',
        title: 'ارشدني الحين لطلاب نظم المعلومات',
        body: `ملفك لتخصص «${info.major ?? 'علوم الحاسب'}». الموقع الحين لطلاب النظم بس، وبنوسّعه لتخصصات ثانية قريب. ملفاتك ما انحفظت.`,
        slots: [['idle', 'لطلاب نظم المعلومات'], ['idle', 'لطلاب نظم المعلومات']],
        retry: 'اختر ملفات ثانية',
      }
    case 'offline':
      return {
        eyebrow: 'وقف الحفظ في النص',
        title: 'انقطع النت',
        body: 'ملفاتك ما ضاعت، محفوظة في جوالك. أول ما يرجع النت اضغط «جرّب مرة ثانية» ونكمل من مكان ما وقفنا.',
        slots: [['done', 'قريناه'], ['missing', 'ما انحفظ']],
        retry: 'جرّب مرة ثانية',
      }
    default:
      return {
        title: 'ارفع الملفات',
        body: 'من الخدمات الذاتية. اخترهم مع بعض أو واحد واحد، وإحنا نعرف كل واحد لحاله.',
        slots: [['idle', 'منه نعرف وش باقي عليك ومسارك'], ['idle', 'منه نعرف درجاتك ومعدلك']],
      }
  }
}

export default function UploadScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const demoState = params.get('state')
  const { applyUpload, hasRecord } = useStudent()
  const input = useRef(null)
  const lastParsed = useRef(null) // نحتفظ بالقراءة عشان «جرّب مرة ثانية» ما يحتاج يختار من جديد
  const kept = useRef({}) // الملف اللي وصل لو اختار ملف ملف، نستناه لين يجي الثاني
  const [status, setStatus] = useState('idle')
  const [info, setInfo] = useState({})

  const shown = demoState ?? status
  const copy = copyFor(shown, info)
  const isError = ['unreadable', 'missing', 'offline', 'other_major'].includes(shown)

  async function save(parsed) {
    setStatus('loading')
    const problem = await applyUpload(parsed)
    if (problem) setStatus('offline')
    else navigate('/confirm')
  }

  async function handleFiles(event) {
    const files = event.target.files
    if (!files?.length) return
    setStatus('loading')
    setInfo({})
    try {
      const result = await readPortalFiles(files, kept.current)
      if (!result.ok) {
        // تخصص ثاني: ننسى أي ملف وصل قبل، عشان ما يختلط.
        kept.current = result.problem === 'other_major' ? {} : (result.found ?? kept.current)
        setInfo(result)
        setStatus(result.problem)
        return
      }
      kept.current = {}
      lastParsed.current = result
      await save(result)
    } catch (error) {
      console.error('[Ershodani] Could not read the files:', error)
      setInfo({ reason: 'broken' })
      setStatus('unreadable')
    } finally {
      event.target.value = '' // عشان لو اختار نفس الملفات مرة ثانية، يشتغل
    }
  }

  function primaryAction() {
    if (shown === 'offline' && lastParsed.current) return save(lastParsed.current)
    input.current?.click()
  }

  // أول مرة يدخل (ما رفع ملفات قبل، وما شاف الترحيب): نوريه الخطوات أول.
  if (!hasRecord && !demoState && !hasBeenWelcomed()) return <Navigate to="/welcome" replace />

  return (
    <main className="screen screen--roomy">
      <input ref={input} type="file" accept="application/pdf,.pdf" multiple hidden onChange={handleFiles} />
      {/* لو عنده خطة من قبل، يقدر يرجع لها. أول مرة؟ ما فيه صفحة قبلها. */}
      {hasRecord ? (
        <BackHeader to="/plan" label="رجوع لخطتك"><span className="muted">خطتك</span></BackHeader>
      ) : (
        <header className="header">
          <LogoLockup />
          <div className="header__end"><MenuButton /></div>
        </header>
      )}
      <Steps step={1} percent={{ idle: 50, loading: 75, offline: 62 }[shown] ?? 50} />

      <div className="stack" role={isError ? 'alert' : undefined} aria-live="polite">
        {copy.eyebrow && (
          <div className="eyebrow warn">
            {shown === 'offline' ? <WifiOffIcon /> : <AlertIcon />}
            {copy.eyebrow}
          </div>
        )}
        <h1 className="display">{copy.title}</h1>
        <p className="muted">
          {copy.fileName && (
            <>
              الملف <span dir="ltr">«{copy.fileName}»</span>{' '}
            </>
          )}
          {copy.body}
        </p>
      </div>

      <div className="stack">
        <Slot number="١" title={REPORT} status={copy.slots[0][0]} note={copy.slots[0][1]} />
        <Slot number="٢" title={TRANSCRIPT} status={copy.slots[1][0]} note={copy.slots[1][1]} />
        <Link to="/privacy" className="link muted">🔒 ملفاتك ما تطلع من جوالك. وش نحفظ؟</Link>
      </div>

      <div className="footer">
        {shown === 'loading' ? (
          <div className="btn btn--loading" role="status">
            <Spinner />
            نقرأ… ثواني
          </div>
        ) : (
          <button type="button" className="btn btn--primary" onClick={primaryAction}>
            {shown === 'idle' && <UploadIcon />}
            {copy.retry ?? 'اختر الملفين'}
          </button>
        )}
        {/* [?] شاشة الإدخال اليدوي ما انبنت للحين، فنخلي الرابط في صفحات التجربة بس */}
        {demoState === 'idle' && <Link to="/confirm" className="btn btn--secondary">ما عندي الملفات، بحددها بيدي</Link>}
        <SignOutLink />
      </div>
    </main>
  )
}
