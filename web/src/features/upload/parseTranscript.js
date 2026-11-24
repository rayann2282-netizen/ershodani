// قراءة «سجل الطالب الأكاديمي».
// الصفحة فيها جدولين جنب بعض (يمين ويسار)، كل جدول فيه فصول:
//   عنوان الفصل «الفصل الدراسي الثاني 1446 هـ …»
//   صفوف المواد: رمز المقرر (ملصوق: «نال1200») · الاسم · الوحدات · النقاط · التقدير
//   صف «التراكمي»: المسجلة · المجتازة · المكتسبة · النقاط · المعدل

import { courseKey, splitGluedCode } from './normalize.js'
import { toRows, rowText } from './rows.js'
import { gradeStatus } from '../courses/plan.js'

const GRADES = ['أ+', 'أ', 'ب+', 'ب', 'ج+', 'ج', 'د+', 'د', 'ند', 'هـ', 'ه', 'ح', 'هد', 'ع', 'م', 'ل']
const normalizeGrade = (g) => (g === 'ه' ? 'هـ' : g)

export function parseTranscript(pages) {
  // نقسم الصفحة نصين عند منتصفها تقريباً.
  const widths = pages.flatMap((p) => p.items.map((it) => it.x))
  const split = widths.length ? (Math.max(...widths) + Math.min(...widths)) / 2 : 0
  const rows = toRows(pages, { split })

  const entries = new Map() // آخر تقدير لكل مادة
  let best = null // أكبر صف «تراكمي» = آخر فصل
  const termByHalf = {}

  // نمشي من فوق لتحت، كل نص لحاله، عشان نعرف الفصل الحالي لكل صف.
  const ordered = [...rows].sort((a, b) => a.page - b.page || (a.half === b.half ? b.y - a.y : a.half === 'right' ? -1 : 1))

  for (const row of ordered) {
    const text = rowText(row)

    const term = text.match(/الفصل الدراسي\s+(\S+)\s+(\d{4})/)
    if (term) {
      termByHalf[row.half] = `الفصل ${term[1]} ${term[2]}`
      continue
    }

    if (text.includes('التراكمي')) {
      const numbers = row.cells.map((c) => Number(c.text.replace('٫', '.').replace(',', '.'))).filter((n) => !Number.isNaN(n))
      const gpa = numbers.find((n) => n <= 5 && !Number.isInteger(n)) ?? numbers.find((n) => n <= 5)
      const points = Math.max(...numbers)
      const hours = numbers.filter((n) => Number.isInteger(n) && n !== points)
      if (gpa !== undefined && (!best || points > best.points)) best = { gpa, points, earned: Math.max(...hours, 0) }
      continue
    }

    const code = row.cells.map((c) => splitGluedCode(c.text)).find(Boolean)
    if (!code) continue
    const grade = row.cells.map((c) => c.text.replace(/\s/g, '')).find((t) => GRADES.includes(t))
    if (!grade) continue
    entries.set(courseKey(code.prefix, code.number), { grade: normalizeGrade(grade), term: termByHalf[row.half] ?? null })
  }

  const transcript = [...entries].map(([course, e]) => ({ course, grade: e.grade, term: e.term }))
  return {
    transcript,
    summary: {
      cumulativeGpa: best ? Math.round(best.gpa * 100) / 100 : null,
      earnedHours: best ? best.earned : 0,
      passedCount: transcript.filter((t) => gradeStatus(t.grade) === 'passed').length,
    },
  }
}
