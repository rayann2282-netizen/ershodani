import { createClient } from '@supabase/supabase-js'
import { env, missingEnv } from './env.js'

// اتصال واحد بـ Supabase لكل الموقع. نستخدم المفتاح العام (anon) بس:
// الحماية الحقيقية في قاعدة البيانات (Row Level Security)، مو هنا.
export const supabase = missingEnv.length === 0 ? createClient(env.supabaseUrl, env.supabaseAnonKey) : null
