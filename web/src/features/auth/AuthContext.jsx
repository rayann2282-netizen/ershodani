import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'

// Context الطالب اللي داخل (signed-in user). Supabase Auth يحفظ الجلسة
// في المتصفح، فلو أعاد تحميل الصفحة يبقى داخل.
const AuthContext = createContext(null)

// نحوّل أخطاء Supabase لكلام الطالب يفهمه.
function messageFor(error) {
  const text = `${error?.code ?? ''} ${error?.message ?? ''}`.toLowerCase()
  if (text.includes('invalid') && text.includes('credentials')) return 'الإيميل أو كلمة المرور ما تطابق. تأكد إن لوحة المفاتيح إنجليزي.'
  if (text.includes('already') || text.includes('user_already_exists')) return 'هالإيميل عنده حساب. ادخل بدل ما تسوي حساب جديد.'
  if (text.includes('password') && (text.includes('6') || text.includes('weak') || text.includes('short'))) return 'كلمة المرور لازم تكون ٦ حروف أو أكثر.'
  if (text.includes('email') && text.includes('invalid')) return 'الإيميل مكتوب غلط. تأكد منه.'
  if (text.includes('fetch') || text.includes('network')) return 'ما قدرنا نوصل. تأكد من النت وجرّب مرة ثانية.'
  return 'صار خطأ في الدخول. جرّب مرة ثانية بعد شوي.'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // أول ما يفتح: هل فيه جلسة محفوظة؟
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    // وبعدها: أي دخول أو خروج يحدّثنا.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  // كل دالة ترجع null لو نجحت، أو رسالة خطأ بالعربي.
  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    return error ? messageFor(error) : null
  }

  // الدخول بقوقل: نوديه لصفحة قوقل، وبعد ما يوافق يرجع لـ /login وSupabase يقرأ الجلسة من الرابط.
  // `next` = الصفحة اللي كان رايح لها، عشان نرجعه لها بعد الدخول.
  async function signInWithGoogle(next = '/upload') {
    const redirectTo = `${window.location.origin}/login?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    return error ? messageFor(error) : null
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
    if (error) return messageFor(error)
    // «Confirm email» مقفل في Supabase، فالجلسة ترجع على طول.
    if (!data.session) return 'انسوّى الحساب، بس لازم تأكيد الإيميل. قفّل «Confirm email» في Supabase.'
    return null
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const value = { session, user: session?.user ?? null, ready, signIn, signInWithGoogle, signUp, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
