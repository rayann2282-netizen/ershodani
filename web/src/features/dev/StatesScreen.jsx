import { Link } from 'react-router'
import { LogoLockup } from '../../components/Logo.jsx'
import { useStudent } from '../courses/StudentContext.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

// صفحة للتجربة بس: روابط لكل حالة. نشيلها قبل النشر.
const LINKS = [
  ['ارفع ملفاتك', '/upload'],
  ['ارفع · تحميل', '/upload?state=loading'],
  ['ارفع · ما انقرأ', '/upload?state=unreadable'],
  ['ارفع · ناقص ملف', '/upload?state=missing'],
  ['ارفع · انقطع النت', '/upload?state=offline'],
  ['تأكد من موادك', '/confirm'],
  ['تأكد · أول ترم', '/confirm?state=empty'],
  ['خطتك', '/plan'],
  ['خطتك · تحميل', '/plan?state=loading'],
  ['خطتك · فاضي', '/plan?state=empty'],
  ['خطتك · فوق الحد', '/plan?state=full'],
  ['خطتك · ما انحفظت', '/plan?state=save-error'],
  ['خطتك · انحفظت', '/plan?state=saved'],
  ['خطتك · حذف (ع)', '/plan?state=withdrawn'],
  ['خطتك · مادة تدرسها الحين (م)', '/plan?state=in-progress'],
  ['مادة مقفلة', '/plan/locked/' + encodeURIComponent('عال 1322')],
  ['اختر متطلباتك', '/electives'],
  ['اختر · وصل الحد', '/electives?state=full'],
  ['اختر · كمّل المتطلبات', '/electives?state=empty'],
  ['المعدل اللي تحتاجه', '/gpa'],
]

export default function StatesScreen() {
  const { resetProgress } = useStudent()
  const { user, signOut } = useAuth()
  return (
    <main className="screen">
      <header className="header"><LogoLockup /></header>
      <h1 className="title">كل الشاشات والحالات</h1>
      <p className="caption muted">داخل بـ <bdi dir="ltr">{user?.email}</bdi></p>
      <button type="button" className="link" onClick={resetProgress}>امسح البيانات المحفوظة في المتصفح</button>
      <button type="button" className="link" onClick={signOut}>اطلع من حسابك</button>
      <nav className="stack" style={{ gap: 0 }}>
        {LINKS.map(([label, to]) => (
          <Link key={to} to={to} className="row">{label}</Link>
        ))}
      </nav>
    </main>
  )
}
