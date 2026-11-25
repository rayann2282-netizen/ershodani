import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { CloseIcon, MenuIcon } from './Icons.jsx'
import { useAuth } from '../features/auth/AuthContext.jsx'
import { useStudent } from '../features/courses/StudentContext.jsx'

const TARTEBAH_URL = 'https://trtebh.com/'

// كل صفحات الموقع في مكان واحد. اللي تحتاج ملفاته (needsRecord) ما تطلع لين يرفعها.
const PAGES = [
  { to: '/plan', label: 'خطتك', icon: '📋', needsRecord: true },
  { to: '/confirm', label: 'تأكيد موادك', icon: '✅', needsRecord: true },
  { to: '/electives', label: 'اختر متطلباتك', icon: '➕', needsRecord: true },
  { to: '/gpa', label: 'المعدل اللي تحتاجه', icon: '🎯', needsRecord: true },
  { to: '/upload', label: 'ارفع ملفاتك من جديد', icon: '📄' },
  { to: '/privacy', label: 'خصوصيتك', icon: '🔒' },
]

// زر ☰ في الزاوية، وقائمة تطلع من الجنب. يطلع بس للي داخل حسابه.
export function MenuButton() {
  const { user, signOut } = useAuth()
  const { hasRecord } = useStudent()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  // Escape يسكّرها، مثل أي نافذة.
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!user) return null
  const pages = PAGES.filter((p) => hasRecord || !p.needsRecord)

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <button type="button" className="icon-btn" aria-label="القائمة" aria-expanded={open} onClick={() => setOpen(true)} data-no-capture>
        <MenuIcon />
      </button>

      {open && (
        <div className="scrim scrim--side" onClick={() => setOpen(false)}>
          <nav className="drawer" aria-label="صفحات الموقع" onClick={(e) => e.stopPropagation()}>
            <div className="drawer__top">
              <span className="title">وين تبي تروح؟</span>
              <button type="button" className="icon-btn" aria-label="سكّر القائمة" onClick={() => setOpen(false)} autoFocus>
                <CloseIcon />
              </button>
            </div>

            {pages.map((p) => (
              <Link key={p.to} to={p.to} className="drawer__link" aria-current={pathname.startsWith(p.to) ? 'page' : undefined} onClick={() => setOpen(false)}>
                <span aria-hidden="true">{p.icon}</span>
                {p.label}
              </Link>
            ))}
            <a href={TARTEBAH_URL} target="_blank" rel="noopener noreferrer" className="drawer__link" onClick={() => setOpen(false)}>
              <span aria-hidden="true">🗓️</span>
              رتّب جدولك في «ترتيبه» ↗
            </a>

            <button type="button" className="link muted drawer__signout" onClick={handleSignOut}>اطلع من حسابك</button>
          </nav>
        </div>
      )}
    </>
  )
}
