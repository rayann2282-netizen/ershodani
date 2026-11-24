// قراءة «كشف بالمقررات المتبقية على الطالب».
// الكشف مقسوم «مجموعات»: كل مجموعة تبدأ بسطر «وصف المجموعة <الاسم> [تجاوز … من المجموعة]»
// وتحتها صفوف: رمز المقرر · رقمه · اسمه · الوحدات · حالته (مجتاز / غير مجتاز).

import { courseKey } from './normalize.js'
import { toRows, rowText } from './rows.js'

const ARABIC_COUNT = { 'واحد': 1, 'مقرر': 1, 'مقررين': 2, 'ساعتين': 2 }

// «تجاوز مقررين من المجموعة» ← { type: 'courses', count: 2 }
// «تجاوز 6 ساعات من المجموعة» ← { type: 'hours', count: 6 }
export function parseRule(text) {
  const match = text.match(/تجاوز\s+(.+?)\s+من المجموعة/)
  if (!match) return null
  const words = match[1].split(' ')
  const type = /ساع/.test(match[1]) ? 'hours' : 'courses'
  const number = words.map((w) => Number(w)).find((n) => Number.isInteger(n) && n > 0)
  const count = number ?? words.map((w) => ARABIC_COUNT[w]).find(Boolean) ?? 1
  return { type, count }
}

// «نظم المعلومات ف4» ← 4
const levelOf = (name) => Number(name.match(/ف\s*(\d)/)?.[1]) || null

export function parseReport(pages) {
  const groups = []
  let current = null

  for (const row of toRows(pages)) {
    const text = rowText(row)

    if (text.includes('وصف المجموعة')) {
      const rule = parseRule(text)
      const name = text
        .replace('وصف المجموعة', '')
        .replace(/تجاوز\s+.+?\s+من المجموعة/, '')
        .trim()
      // نفس المجموعة ممكن تكمل في الصفحة اللي بعدها، وعنوانها يتكرر.
      current = groups.find((g) => g.name === name)
      if (!current) {
        current = { name, rule, level: levelOf(name), courses: [] }
        groups.push(current)
      }
      continue
    }

    if (!current) continue
    const number = row.cells.find((c) => /^\d{4}$/.test(c.text))
    const prefix = row.cells.find((c) => /^[ء-ي]{2,5}$/.test(c.text) && c.x > (number?.x ?? 0))
    if (!number || !prefix) continue
    const status = text.includes('غير مجتاز') ? 'not_passed' : text.includes('مجتاز') ? 'passed' : null
    const hours = Number(row.cells.find((c) => /^\d{1,2}$/.test(c.text))?.text) || null
    // اسم المادة: أطول نص عربي في الصف غير الرمز والحالة.
    const name = row.cells
      .map((c) => c.text)
      .filter((t) => t !== prefix.text && !/مجتاز/.test(t) && /[ء-ي]/.test(t))
      .sort((a, b) => b.length - a.length)[0]
    current.courses.push({ key: courseKey(prefix.text, number.text), name: name ?? null, hours, status })
  }

  return summarizeReport(groups)
}

// من المجموعات ← شكل الطالب اللي تستخدمه الخطة.
export function summarizeReport(groups) {
  const notPassed = (g) => g.courses.filter((c) => c.status === 'not_passed').map((c) => c.key)

  const levelGroups = groups.filter((g) => g.level).sort((a, b) => a.level - b.level)
  const nextLevel = levelGroups.find((g) => notPassed(g).length > 0)

  const mandatory = groups.find((g) => g.name.includes('متطلب جامعي اجباري'))

  // أقسام المتطلبات اللي يختار منها: مو مستوى، ومو الإجباري، ومو اختياريات التخصص (تبدأ من المستوى ٦).
  const choiceGroups = groups.filter((g) => !g.level && g !== mandatory && !g.name.includes('نظم معلومات') && g.rule)

  return {
    currentLevel: nextLevel ? { level: nextLevel.level, courses: notPassed(nextLevel) } : { level: null, courses: [] },
    mandatoryUniversity: mandatory ? notPassed(mandatory) : [],
    groups: choiceGroups.map((g) => {
      const passedRows = g.courses.filter((c) => c.status === 'passed')
      const perCourse = g.rule.type === 'hours' ? 2 : 1
      const required = g.rule.type === 'hours' ? Math.ceil(g.rule.count / perCourse) : g.rule.count
      const passed = g.rule.type === 'hours' ? Math.floor(passedRows.reduce((s, c) => s + (c.hours ?? 2), 0) / perCourse) : passedRows.length
      // نحفظ أسماء المواد من الكشف، لأن بعض المتطلبات الجامعية مو في studyPlan.js.
      const names = Object.fromEntries(g.courses.filter((c) => c.status === 'not_passed' && c.name).map((c) => [c.key, c.name]))
      return { name: g.name, required, passed: Math.min(passed, required), options: notPassed(g), names }
    }),
    // كل المستويات اللي باقي فيها شي، بالترتيب. نعبّي منها الخطة لو مستواك ما يكفي.
    remainingLevels: levelGroups.filter((g) => notPassed(g).length > 0).map((g) => ({ level: g.level, courses: notPassed(g) })),
  }
}
