// تخصص الطالب من ملفاته. الموقع الحين لطلاب نظم المعلومات بس.
//   الكشف: «وصف البرنامج بكالوريوس نظم معلومات»
//   السجل: «التخصص : نظم المعلومات»
// لو ما لقينا السطر (مثلاً الخدمات الذاتية غيّرت شكل الملف) نرجّع null، والموقع يكمل عادي.

import { toRows, rowText } from './rows.js'

// الكلمات اللي تجي جنب التخصص في نفس السطر، نوقف عندها.
// (بدون \b: الـ \b في JavaScript ما يعرف الحروف العربية.)
const OTHER_LABELS = /\s*(?:رمز البرنامج|الكلية|الدرجة|الرقم|الاسم|المستوى|الحالة).*$/

const LABELS = {
  remaining_report: /وصف البرنامج\s*:?\s*(?:بكالوريوس\s+)?(.+)/,
  transcript: /التخصص\s*:?\s*(.+)/,
}

export function detectMajor(pages, kind) {
  const label = LABELS[kind]
  if (!label) return null
  for (const row of toRows(pages)) {
    const text = rowText(row).replace(/ـ/g, '') // «التـخصص» ← «التخصص»
    const match = text.match(label)
    if (match) {
      const name = match[1].replace(OTHER_LABELS, '').replace(/[-–]+$/, '').trim()
      if (name) return name
    }
  }
  return null
}

// «نظم معلومات» و«نظم المعلومات» كلها نفس التخصص.
export function isInformationSystems(major) {
  return /نظم\s*(?:ال)?معلومات/.test(major)
}
