import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { AlertIcon } from '../../components/Icons.jsx'

// الحين ما فيه دخول حقيقي (Supabase يجي مع الباك اند).
// ?state=error يعرض حالة الخطأ.
export default function LoginScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const showError = params.get('state') === 'error'
  const [email, setEmail] = useState('a.aldossary@sm.imamu.edu.sa')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault() // نمنع المتصفح يعيد تحميل الصفحة
    navigate('/upload')
  }

  return (
    <form className="screen screen--roomy" onSubmit={handleSubmit} style={{ paddingBlockStart: 'var(--size-button)' }}>
      <LogoLockup large />

      <div className="stack">
        <h1 className="display">
          وش تنزل
          <br />
          الترم الجاي؟
        </h1>
        <p className="muted">ادخل حسابك، وخلال دقيقة تعرف موادك وش اللي تقفل عليك.</p>
      </div>

      <div className="stack stack--2">
        <div className="field">
          <label htmlFor="email">الإيميل الجامعي</label>
          <input id="email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={showError} aria-describedby={showError ? 'login-error' : undefined} />
        </div>
        <div className="field">
          <label htmlFor="password">كلمة المرور</label>
          <input id="password" type="password" dir="ltr" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={showError} aria-describedby={showError ? 'login-error' : undefined} />
        </div>
        {showError && (
          <div id="login-error" role="alert" className="eyebrow warn" style={{ fontWeight: 400, alignItems: 'flex-start' }}>
            <AlertIcon />
            <span>الإيميل أو كلمة المرور ما تطابق. تأكد إن لوحة المفاتيح إنجليزي، أو غيّر كلمة المرور من تحت.</span>
          </div>
        )}
        <button type="button" className="link">نسيت كلمة المرور؟</button>
      </div>

      <div className="footer">
        <button type="submit" className="btn btn--primary">ادخل</button>
        {!showError && (
          <Link to="/upload" className="btn btn--text">ما عندك حساب؟ سوّ حساب</Link>
        )}
      </div>
    </form>
  )
}
