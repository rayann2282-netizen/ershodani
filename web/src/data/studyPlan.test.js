// قرار ٢٧: نتأكد إن بيانات الخطة متماسكة. غلطة هنا تخرب الـ demo.
// (ومواد المستوى ٤ و٥ يراجعها الطالب مع شخص من القسم.)
import { describe, it, expect } from 'vitest'
import { COURSES } from './studyPlan.js'

const entries = Object.entries(COURSES)

describe('studyPlan.js', () => {
  it('every prerequisite is a course in the plan', () => {
    for (const [key, c] of entries) for (const p of c.prereqs) expect(COURSES[p], `${key} needs ${p}`).toBeDefined()
  })

  it('every prerequisite comes from an earlier level', () => {
    for (const [key, c] of entries) for (const p of c.prereqs) expect(COURSES[p].level, `${p} → ${key}`).toBeLessThan(c.level)
  })

  it('keys look like «نال 1200»', () => {
    for (const [key] of entries) expect(key).toMatch(/^[ء-ي]{2,5} \d{4}$/)
  })

  // مجموع ساعات المواد الإجبارية من ملف الخطة الرسمية (بدون المتطلبات الجامعية والحرة).
  it.each([
    [4, 16],
    [5, 14],
    [6, 13],
    [7, 9],
    [8, 8],
  ])('level %i has %i mandatory hours, like the official plan', (level, hours) => {
    const total = entries.filter(([, c]) => c.level === level && c.type === 'mandatory').reduce((s, [, c]) => s + c.hours, 0)
    expect(total).toBe(hours)
  })
})
