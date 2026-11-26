// نتأكد إن متغيرات البيئة (environment variables) موجودة قبل ما يشتغل الموقع.
// قيمها في web/.env.local (ما ينرفع على git). الأسماء بس في web/.env.example.
//
// مهم للأمان: نقرأ كل متغير باسمه الكامل (import.meta.env.VITE_…).
// لو قرأناها باسم متغيّر مثل import.meta.env[name]، Vite يحط كل متغيرات VITE_
// في الموقع المنشور، ومنها معلومات Vercel عن الـ repo والـ commits.
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

const REQUIRED = { VITE_SUPABASE_URL: env.supabaseUrl, VITE_SUPABASE_ANON_KEY: env.supabaseAnonKey }

export const missingEnv = Object.keys(REQUIRED).filter((name) => !REQUIRED[name])

// خطأ واحد واضح في الـ console (ما نطبع القيم نفسها أبداً).
if (missingEnv.length > 0) {
  console.error(
    `[Ershodani] Missing environment variable(s): ${missingEnv.join(', ')}. ` +
      'Add them to web/.env.local (names are in web/.env.example), then restart "npm run dev".',
  )
}
