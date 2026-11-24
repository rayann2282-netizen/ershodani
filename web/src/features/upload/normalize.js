// تنظيف النص اللي يطلع من الـ PDF.
// ملفات البوابة تكتب العربي بـ «presentation forms» (أشكال الحروف مثل ﻧﺎﻝ بدل نال)،
// والأرقام عربية-هندية. نرجّع كل شي لشكل واحد عشان نقدر نقارن.

import { COURSES, UNIVERSITY_COURSES } from '../../data/studyPlan.js'

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩'

export function cleanText(text) {
  return String(text)
    .normalize('NFKC') // ﻧﺎﻝ ← نال
    .replace(/[٠-٩]/g, (d) => ARABIC_INDIC.indexOf(d)) // ١٢٤٢ ← 1242
    .replace(/\s+/g, ' ')
    .trim()
}

// للمقارنة بس: نشيل الهمزات عشان «قرا» في الكشف = «قرأ» في الخطة.
const loose = (text) => cleanText(text).replace(/[أإآ]/g, 'ا').replace(/\s/g, '')

// كل مفاتيح المواد اللي نعرفها، مرتبة بالشكل المتساهل.
const KNOWN = new Map([...Object.keys(COURSES), ...Object.keys(UNIVERSITY_COURSES)].map((key) => [loose(key), key]))

// «ﻧﺎﻝ» + «١٢٢٠» ← «نال 1220». لو المادة في الخطة نرجّع مفتاحها نفسه.
export function courseKey(prefix, number) {
  const p = cleanText(prefix).replace(/\s/g, '')
  const n = cleanText(number).replace(/\s/g, '')
  return KNOWN.get(loose(p + n)) ?? `${p} ${n}`
}

// «نال١٢٢٠» (ملصوقين) ← { prefix: 'نال', number: '1220' }
export function splitGluedCode(text) {
  const match = cleanText(text).match(/^([ء-ي]{2,5})\s*(\d{4})$/)
  return match ? { prefix: match[1], number: match[2] } : null
}
