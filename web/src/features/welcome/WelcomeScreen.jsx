import { Link } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { SignOutLink } from '../auth/SignOutLink.jsx'
import { MenuButton } from '../../components/Menu.jsx'
import { markWelcomed } from './welcomed.js'

// أول مرة يدخل: ٣ خطوات تشرح الموقع في ٥ ثواني، وبعدها يروح للرفع.
const STEPS = [
  { title: 'ارفع الملفين من الخدمات الذاتية', body: 'كشف المقررات المتبقية والسجل الأكاديمي. نقرأهم في جوالك، وما يطلعون منه.' },
  { title: 'تأكد من موادك', body: 'نعرض لك المواد اللي خلصتها. لو فيه غلط، تصلحه بضغطة.' },
  { title: 'خذ خطتك للترم الجاي', body: 'وش تسجّل، ووش مقفل عليك وليش، والمعدل اللي تحتاجه.' },
]

export default function WelcomeScreen() {
  return (
    <main className="screen screen--roomy">
      <header className="header">
        <LogoLockup />
        <div className="header__end"><MenuButton /></div>
      </header>

      <div className="stack">
        <h1 className="display">هلا فيك 👋</h1>
        <p className="muted">ارشدني يرتب لك ترمك الجاي في ٣ خطوات:</p>
      </div>

      <ol className="stack stack--2 grow" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {STEPS.map((s, i) => (
          <li key={s.title} className="card rise" style={{ '--i': i, flexDirection: 'row', gap: 'var(--space-2)' }}>
            <span className="welcome__num title" aria-hidden="true">{['١', '٢', '٣'][i]}</span>
            <span className="row__main">
              <span className="bold">{s.title}</span>
              <span className="caption muted">{s.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="footer">
        <Link to="/upload" className="btn btn--primary" onClick={markWelcomed}>يلا نبدأ</Link>
        <SignOutLink />
      </div>
    </main>
  )
}
