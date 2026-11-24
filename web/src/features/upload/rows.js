// نجمع قطع النص في «صفوف»: القطع اللي على نفس الارتفاع (y) تقريباً = سطر واحد في الجدول.
// كذا ما نعتمد على ترتيب النص (اللي يطلع عمود عمود)، بل على مكانه في الصفحة.

import { cleanText } from './normalize.js'

const ROW_TOLERANCE = 3 // نقاط: الدرجة أحياناً أعلى من الرمز بنقطة أو ثنتين

// pages: [{ items: [{ str, x, y }] }]  ←  rows: [{ page, y, cells: [{ text, x }] }] من فوق لتحت
export function toRows(pages, { split } = {}) {
  const rows = []
  pages.forEach((page, pageIndex) => {
    const items = page.items
      .map((it) => ({ text: cleanText(it.str), x: it.x, y: it.y }))
      .filter((it) => it.text)
      .sort((a, b) => b.y - a.y)
    const pageRows = []
    for (const item of items) {
      const half = split ? (item.x > split ? 'right' : 'left') : 'all'
      let row = pageRows.find((r) => r.half === half && Math.abs(r.y - item.y) <= ROW_TOLERANCE)
      if (!row) {
        row = { page: pageIndex, half, y: item.y, cells: [] }
        pageRows.push(row)
      }
      row.cells.push({ text: item.text, x: item.x })
    }
    // من اليمين لليسار داخل الصف، مثل القراءة العربية.
    pageRows.forEach((r) => r.cells.sort((a, b) => b.x - a.x))
    rows.push(...pageRows)
  })
  return rows
}

export const rowText = (row) => row.cells.map((c) => c.text).join(' ')

// نعرف نوع الملف من عنوانه.
export function detectKind(pages) {
  const all = pages.flatMap((p) => p.items.map((it) => cleanText(it.str))).join(' ')
  if (all.includes('كشف بالمقررات المتبقية')) return 'remaining_report'
  if (all.includes('سجل الطالب الأكاديمي') || all.includes('سجل الطالب الاكاديمي')) return 'transcript'
  return 'unknown'
}
