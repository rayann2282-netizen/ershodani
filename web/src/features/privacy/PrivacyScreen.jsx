import { useLocation, useNavigate } from 'react-router'
import { BackIcon } from '../../components/Icons.jsx'
import { LogoTile } from '../../components/Logo.jsx'
import { MenuButton } from '../../components/Menu.jsx'

// صفحة الخصوصية: وش نقرأ، وش نحفظ، ووش ما نحفظ أبدًا.
// مفتوحة للكل (بدون دخول)، وقوقل يطلب رابطها عشان ننشر الدخول بقوقل.
export const SECTIONS = [
  {
    title: 'ملفاتك ما تطلع من جوالك',
    body: 'نقرأ كشف المقررات المتبقية والسجل الأكاديمي داخل متصفحك. الملف نفسه ما ينرفع لأي مكان، ولا نحفظه.',
  },
  {
    title: 'وش نحفظ',
    body: 'قائمة موادك وتقديراتها، ومستواك، ومعدلك وساعاتك، والمتطلبات اللي اخترتها، وأرقام صفحة المعدل. نحفظها عشان تلقاها لو دخلت من جوال ثاني.',
  },
  {
    title: 'وش ما نحفظ أبدًا',
    body: 'ملفات الـ PDF، واسمك الكامل، ورقمك الجامعي، وسنة ميلادك.',
  },
  {
    title: 'مين يشوف بياناتك',
    body: 'أنت بس. كل طالب ما يقدر يوصل إلا لبياناته، والحماية داخل قاعدة البيانات نفسها (Supabase). ما نبيع ولا نشارك بياناتك مع أحد.',
  },
  {
    title: 'الدخول بقوقل',
    body: 'لو دخلت بحساب قوقل، ناخذ منه إيميلك واسم الحساب بس، عشان نعرف إنه أنت. ما نوصل لإيميلاتك ولا ملفاتك في قوقل.',
  },
]

export default function PrivacyScreen() {
  const navigate = useNavigate()
  // يرجع للصفحة اللي جاء منها، ولو فتح الرابط مباشرة يروح للدخول.
  // location.key = 'default' يعني أول صفحة فتحها في الموقع (ما فيه صفحة قبلها عندنا).
  const location = useLocation()
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/login'))

  return (
    <main className="screen">
      <header className="header">
        <button type="button" className="icon-btn" aria-label="رجوع" onClick={goBack}>
          <BackIcon />
        </button>
        <span className="muted">رجوع</span>
        <div className="header__end">
          <LogoTile alone />
          <MenuButton />
        </div>
      </header>

      <div className="stack">
        <h1 className="display">خصوصيتك</h1>
        <p className="muted">باختصار: ملفاتك تبقى في جوالك، ونحفظ موادك بس عشان نرتب خطتك.</p>
      </div>

      <div className="stack stack--2 grow">
        <PrivacySections />
      </div>

      <div className="footer">
        <button type="button" className="btn btn--secondary" onClick={goBack}>ارجع للموقع</button>
      </div>
    </main>
  )
}

// البطاقات نفسها: تُستخدم في صفحة الخصوصية، وفي النافذة اللي تطلع من صفحة الدخول.
export function PrivacySections() {
  return SECTIONS.map((s) => (
    <section key={s.title} className="card">
      <h2 className="bold">{s.title}</h2>
      <p className="caption muted">{s.body}</p>
    </section>
  ))
}
