// نتأكد إن متغيرات البيئة (environment variables) موجودة قبل ما يشتغل الموقع.
// قيمها في web/.env.local (ما ينرفع على git). الأسماء بس في web/.env.example.

const REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']

export const missingEnv = REQUIRED.filter((name) => !import.meta.env[name])

// خطأ واحد واضح في الـ console (ما نطبع القيم نفسها أبداً).
if (missingEnv.length > 0) {
  console.error(
    `[Ershodani] Missing environment variable(s): ${missingEnv.join(', ')}. ` +
      'Add them to web/.env.local (names are in web/.env.example), then restart "npm run dev".',
  )
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
}
