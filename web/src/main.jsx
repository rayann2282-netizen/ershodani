import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens.css'
import './styles.css'
import App from './App.jsx'
import { missingEnv } from './lib/env.js'

// لو ناقص متغير بيئة، نعرض رسالة واضحة بدل شاشة بيضا.
function MissingEnv() {
  return (
    <main className="screen" style={{ justifyContent: 'center' }}>
      <h1 className="title">ناقص إعداد Supabase</h1>
      <p className="muted">
        سوّ ملف <span dir="ltr">web/.env.local</span> وحط فيه القيم من Supabase ← Project Settings ← API، وبعدها أعد تشغيل <span dir="ltr">npm.cmd run dev</span>.
      </p>
      <p className="caption muted" dir="ltr" style={{ textAlign: 'right' }}>
        Missing: {missingEnv.join(', ')}
      </p>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<StrictMode>{missingEnv.length ? <MissingEnv /> : <App />}</StrictMode>)
