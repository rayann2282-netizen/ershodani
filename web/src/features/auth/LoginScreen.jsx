import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { AlertIcon, Spinner } from '../../components/Icons.jsx'
import { useAuth } from './AuthContext.jsx'

// شاشة وحدة للدخول وسوّ حساب: ?mode=signup يبدّلها.
// ?state=error للتجربة بس (يعرض رسالة الخطأ بدون ما يكلم Supabase).
const DEMO_ERROR = 'الإيميل أو كلمة المرور ما تطابق. تأكد إن لوحة المفاتيح إنجليزي، أو غيّر كلمة المرور من تحت.'

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const isSignup = params.get('mode') === 'signup'
  const { user, ready, signIn, signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(params.get('state') === 'error' ? DEMO_ERROR : null)

  // بعد الدخول نرجعه للشاشة اللي كان رايح لها، أو نبدأ من الرفع.
  const nextPath = location.state?.from ?? '/upload'
  if (ready && user) return <Navigate to={nextPath} replace />

  async function handleSubmit(event) {
    event.preventDefault() // نمنع المتصفح يعيد تحميل الصفحة
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
          {isSignup ? 'سوّ حسابك بإيميلك الجامعي، وخلال دقيقة تعرف موادك وش اللي تقفل عليك.' : 'ادخل حسابك، وخلال دقيقة تعرف موادك وش اللي تقفل عليك.'}
        </p>
      </div>

      <div className="stack stack--2">
        <div className="field">
          <label htmlFor="email">الإيميل الجامعي</label>
          <input id="email" type="email" dir="ltr" autoComplete="email" placeholder="name@sm.imamu.edu.sa" required value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
        </div>
        <div className="field">
          <label htmlFor="password">كلمة المرور</label>
          <input id="password" type="password" dir="ltr" autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? 'login-error' : undefined} />
        </div>
        {error && (
          <div id="login-error" role="alert" className="eyebrow warn" style={{ fontWeight: 400, alignItems: 'flex-start' }}>
            <AlertIcon />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="footer">
        <button type="submit" className={busy ? 'btn btn--loading' : 'btn btn--primary'} disabled={busy} aria-live="polite">
          {busy && <Spinner />}
          {busy ? (isSignup ? 'نسوّي حسابك…' : 'ندخلك…') : isSignup ? 'سوّ حسابي' : 'ادخل'}
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
