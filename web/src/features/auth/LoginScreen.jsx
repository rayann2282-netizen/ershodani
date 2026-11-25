import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { AlertIcon, GoogleIcon, Spinner } from '../../components/Icons.jsx'
import { useAuth } from './AuthContext.jsx'

// شاشة وحدة للدخول وسوّ حساب: ?mode=signup يبدّلها.
// ?state=error للتجربة بس (يعرض رسالة الخطأ بدون ما يكلم Supabase).
const DEMO_ERROR = 'الإيميل أو كلمة المرور ما تطابق. تأكد إن لوحة المفاتيح إنجليزي.'
const GOOGLE_ERROR = 'ما قدرنا ندخلك بقوقل. جرّب مرة ثانية، أو ادخل بإيميلك.'
const CONSENT_ERROR = 'لازم توافق على الخصوصية والشروط أول. تقدر تقرأها من الزر اللي فوق.'
const CONSENT_KEY = 'ershodani.privacyAccepted'

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const isSignup = params.get('mode') === 'signup'
  const { user, ready, signIn, signInWithGoogle, signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [accepted, setAccepted] = useState(() => {
    try {
      return localStorage.getItem(CONSENT_KEY) === '1'
    } catch {
      return false
    }
  })
  const [error, setError] = useState(
    params.get('state') === 'error' ? DEMO_ERROR : params.get('error') ? GOOGLE_ERROR : null, // قوقل يرجّع ?error=… لو صار شي
  )

  // بعد الدخول نرجعه للشاشة اللي كان رايح لها، أو نبدأ من الرفع.
  // (?next= يجي من رجعة قوقل. نقبل بس روابط داخل الموقع.)
  const next = params.get('next')
  const nextPath = (next?.startsWith('/') && !next.startsWith('//') ? next : null) ?? location.state?.from ?? '/upload'
  if (ready && user) return <Navigate to={nextPath} replace />

  // لازم يوافق على الخصوصية قبل أي دخول (إيميل أو قوقل). لو وافق قبل من نفس الجوال، نتذكرها.
  function needsConsent() {
    if (accepted) return false
    setError(CONSENT_ERROR)
    return true
  }
  function toggleAccepted(event) {
    setAccepted(event.target.checked)
    if (event.target.checked) setError((e) => (e === CONSENT_ERROR ? null : e))
    try {
      localStorage.setItem(CONSENT_KEY, event.target.checked ? '1' : '0')
    } catch {
      // المتصفح ما سمح: بيسأله مرة ثانية بس
    }
  }

  // خطأ الموافقة يطلع تحت المربع؛ الباقي (إيميل، كلمة مرور، قوقل) يطلع تحت الخانات.
  const fieldError = Boolean(error) && error !== CONSENT_ERROR

  async function handleGoogle() {
    if (needsConsent()) return
    setBusy(true)
    setError(null)
    const message = await signInWithGoogle(nextPath)
    // لو نجح، المتصفح يروح لقوقل؛ لو لا، نعرض الخطأ.
    if (message) {
      setBusy(false)
      setError(GOOGLE_ERROR)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault() // نمنع المتصفح يعيد تحميل الصفحة
    if (needsConsent()) return
    setBusy(true)
    setError(null)
    const message = isSignup ? await signUp(email, password) : await signIn(email, password)
    setBusy(false)
    if (message) setError(message)
    else navigate(nextPath, { replace: true })
  }

  return (
    <form className="screen screen--roomy" onSubmit={handleSubmit} style={{ paddingBlockStart: 'var(--size-button)' }} noValidate>
      <LogoLockup large />

      <div className="stack">
        <h1 className="display">
          وش تنزل
          <br />
          الترم الجاي؟
        </h1>
        <p className="muted">
          {isSignup ? 'سوّ حسابك بإيميلك، وخلال دقيقة تعرف موادك وش اللي تقفل عليك.' : 'ادخل حسابك، وخلال دقيقة تعرف موادك وش اللي تقفل عليك.'}
        </p>
      </div>

      <div className="stack stack--2">
        <div className="field">
          <label htmlFor="email">إيميلك</label>
          <input id="email" type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={fieldError} aria-describedby={fieldError ? 'login-error' : undefined} />
        </div>
        <div className="field">
          <label htmlFor="password">كلمة المرور</label>
          <input id="password" type="password" dir="ltr" autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={fieldError} aria-describedby={fieldError ? 'login-error' : undefined} />
        </div>
        {/* زر واضح تحت كلمة المرور: يقرأ الخصوصية والشروط قبل ما يوافق تحت. */}
        <Link to="/privacy" className="btn btn--secondary privacy-btn">🔒 اقرأ الخصوصية والشروط</Link>
        {fieldError && (
          <div id="login-error" role="alert" className="eyebrow warn" style={{ fontWeight: 400, alignItems: 'flex-start' }}>
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="footer">
        {/* الموافقة على الخصوصية: لازم قبل «ادخل» و«سوّ حسابي» و«قوقل». */}
        <label className="consent">
          <input type="checkbox" checked={accepted} onChange={toggleAccepted} aria-invalid={!fieldError && Boolean(error)} aria-describedby={!fieldError && error ? 'consent-error' : undefined} />
          <span>
            قريت الخصوصية والشروط وأوافق عليها
          </span>
        </label>
        {!fieldError && error && (
          <div id="consent-error" role="alert" className="eyebrow warn" style={{ fontWeight: 400 }}>
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}
        <button type="submit" className={busy ? 'btn btn--loading' : 'btn btn--primary'} disabled={busy} aria-live="polite">
          {busy && <Spinner />}
          {busy ? (isSignup ? 'نسوّي حسابك…' : 'ندخلك…') : isSignup ? 'سوّ حسابي' : 'ادخل'}
        </button>
        {/* قوقل يسوي الحساب لو ما عنده، فنفس الزر للدخول وسوّ حساب. */}
        <button type="button" className="btn btn--secondary" disabled={busy} onClick={handleGoogle}>
          <GoogleIcon />
          ادخل بحساب قوقل
        </button>
        {isSignup ? (
          <Link to="/login" replace className="btn btn--text" state={location.state}>عندك حساب؟ ادخل</Link>
        ) : (
          <Link to="/login?mode=signup" replace className="btn btn--text" state={location.state}>ما عندك حساب؟ سوّ حساب</Link>
        )}
      </div>
    </form>
  )
}
