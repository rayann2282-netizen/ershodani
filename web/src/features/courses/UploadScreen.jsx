import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { Steps } from '../../components/BackHeader.jsx'
import { AlertIcon, CheckIcon, Spinner, UploadIcon, WifiOffIcon } from '../../components/Icons.jsx'

// الحالات: ?state=loading | unreadable | missing | offline
// الحين «اختر الملفين» ما يفتح ملفات فعلاً: يمثّل القراءة ويروح لتأكد من موادك.
// قراءة الـ PDF الحقيقية تجي مع الباك اند.

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

const COPY = {
  idle: {
    title: 'ارفع الملفات',
    body: 'من الخدمات الذاتية. اخترهم مع بعض، وإحنا نعرف كل واحد لحاله.',
    slots: [
      ['idle', 'منه نعرف وش باقي عليك ومسارك'],
      ['idle', 'منه نعرف درجاتك ومعدلك'],
    ],
  },
  loading: {
    title: 'حمل الملفات',
    body: 'ثواني بس. خلّ الصفحة مفتوحة.',
    slots: [
      ['done', 'قريناه · ٢٧ مادة باقية عليك'],
      ['loading', 'نقرأ درجاتك…'],
    ],
  },
  unreadable: {
    eyebrow: 'ما قدرنا نقرأ واحد منهم',
    title: 'السجل صورة',
    body: null, // فيه اسم ملف إنجليزي، فنكتبه تحت
    slots: [
      ['done', 'قريناه'],
      ['error', 'صورة مو PDF'],
    ],
  },
  missing: {
    eyebrow: 'اخترت ملف واحد بس',
    title: 'ناقصك السجل',
    body: 'وصلنا كشف المقررات المتبقية. نحتاج السجل الأكاديمي بعد، عشان نضبطك بأحلى جدول',
    slots: [
      ['done', 'وصل'],
      ['missing', 'ما وصل'],
    ],
  },
  offline: {
    eyebrow: 'وقف الرفع في النص',
    title: 'انقطع النت',
    body: 'ملفاتك ما ضاعت، محفوظة في جوالك. أول ما يرجع النت اضغط «جرّب مرة ثانية» ونكمل من مكان ما وقفنا.',
    slots: [
      ['done', 'انرفع'],
      ['missing', 'وقف عند ٤٠٪'],
    ],
  },
}

export default function UploadScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const state = COPY[params.get('state')] ? params.get('state') : 'idle'
  const copy = COPY[state]
  const isError = ['unreadable', 'missing', 'offline'].includes(state)

  // في التحميل: بعد ثانية ونص نروح لتأكد من موادك (تمثيل للقراءة).
  useEffect(() => {
    if (state !== 'loading') return
    const timer = setTimeout(() => navigate('/confirm'), 1500)
    return () => clearTimeout(timer) // نوقف المؤقت لو طلع من الشاشة
  }, [state, navigate])

  return (
    <main className="screen screen--roomy">
      <header className="header">
        <LogoLockup />
      </header>
      <Steps step={1} percent={{ idle: 50, loading: 75, offline: 62 }[state] ?? 50} />

      <div className="stack" role={isError ? 'alert' : undefined}>
        {copy.eyebrow && (
          <div className="eyebrow warn">
            {state === 'offline' ? <WifiOffIcon /> : <AlertIcon />}
            {copy.eyebrow}
          </div>
        )}
        <h1 className="display">{copy.title}</h1>
        {copy.body && <p className="muted">{copy.body}</p>}
        {state === 'unreadable' && (
          <p className="muted">
            الملف <span dir="ltr">«Screenshot_2026-11-20.png»</span> صورة شاشة، وإحنا نقرأ ملفات PDF بس. نزّل السجل الأكاديمي من البوابة كـ PDF واختره من جديد.
          </p>
        )}
      </div>

      <div className="stack">
        <Slot number="١" title="كشف المقررات المتبقية" status={copy.slots[0][0]} note={copy.slots[0][1]} />
        <Slot number="٢" title="السجل الأكاديمي" status={copy.slots[1][0]} note={copy.slots[1][1]} />
        {(state === 'idle' || state === 'unreadable') && (
          <button type="button" className="link">{state === 'idle' ? 'وين ألقاهم في البوابة؟' : 'كيف أنزّله PDF من البوابة؟'}</button>
        )}
      </div>

      <div className="footer">
        {state === 'loading' ? (
          <div className="btn btn--loading" role="status">
            <Spinner />
            نقرأ… ثواني
          </div>
        ) : (
          <Link to="/upload?state=loading" className="btn btn--primary">
            {state === 'idle' && (
              <>
                <UploadIcon />
                اختر الملفين
              </>
            )}
            {(state === 'unreadable' || state === 'missing') && (state === 'unreadable' ? 'اختر السجل الأكاديمي من جديد' : 'اختر السجل الأكاديمي')}
            {state === 'offline' && 'جرّب مرة ثانية'}
          </Link>
        )}
        {state === 'idle' && <Link to="/confirm" className="btn btn--secondary">ما عندي الملفات، بحددها بيدي</Link>}
        {(state === 'unreadable' || state === 'missing') && <Link to="/confirm" className="btn btn--secondary">كمّل بدونه وحدد درجاتك بيدك</Link>}
      </div>
    </main>
  )
}
