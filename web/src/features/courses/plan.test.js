import { describe, it, expect } from 'vitest'
import { buildPlan, gradeStatus, openGroups, loadHours } from './plan.js'
import { demoStudent, studentForState } from '../../data/mockStudents.js'

describe('gradeStatus', () => {
  it('reads the official grade codes', () => {
    expect(gradeStatus('د')).toBe('passed')
    expect(gradeStatus('ند')).toBe('passed')
    expect(gradeStatus('هـ')).toBe('failed')
    expect(gradeStatus('ح')).toBe('failed')
    expect(gradeStatus('هد')).toBe('failed')
    expect(gradeStatus('ع')).toBe('withdrawn')
    expect(gradeStatus('م')).toBe('in-progress')
    expect(gradeStatus('ل')).toBe('in-progress')
  })
})

describe('buildPlan — demo student', () => {
  const plan = buildPlan({ student: demoStudent })

  it('gives 5 courses and 16 of 19 hours', () => {
    expect(plan.courseCount).toBe(5)
    expect(plan.totalHours).toBe(16)
    expect(plan.maxHours).toBe(19)
    expect(plan.remainingHours).toBe(3)
  })

  it('puts only the failed course first (mandatory university courses are not late)', () => {
    expect(plan.late.map((c) => c.key)).toEqual(['نال 1200'])
    expect(plan.late[0].reason).toBe('failed')
  })

  it('locks علاقات الأعمال because of كفاءات الإدارة, and keeps أنظمة التشغيل open', () => {
    expect(plan.late[0].locks).toEqual(['نال 1290'])
    expect(plan.eligible.map((c) => c.key)).toContain('عال 1322') // needs عال 1242 + نال 1130 (official plan)
  })

  it('shows next-level courses whose prerequisite is in this plan as locked', () => {
    expect(plan.locked.slice(1).map((c) => c.key)).toEqual(['نال 1350', 'نال 1310', 'نال 1321'])
  })
})

describe('buildPlan — equivalent old courses', () => {
  it('counts an old three-semester course as its new equivalent', () => {
    // «عال 1141» (old) = «عال 1241» البرمجة الشيئية, so تراكيب البيانات is open.
    const student = {
      transcript: [{ course: 'عال 1141', grade: 'ب' }],
      currentLevel: { level: 4, courses: ['عال 1242'] },
      remainingLevels: [],
      mandatoryUniversity: [],
    }
    const plan = buildPlan({ student })
    expect(plan.eligible.map((c) => c.key)).toEqual(['عال 1242'])
    expect(plan.locked).toEqual([])
  })
})

describe('buildPlan — filling from the next level', () => {
  // Like a real student: level 4 has only 3 courses left, level 5 has open courses.
  const student = {
    transcript: ['نال 1130', 'نال 1235', 'نال 1200', 'عال 1241', 'عال 1242', 'نال 1220'].map((course) => ({ course, grade: 'ب' })),
    currentLevel: { level: 4, courses: ['حسب 1250', 'نال 1241', 'نال 1290'] },
    remainingLevels: [
      { level: 4, courses: ['حسب 1250', 'نال 1241', 'نال 1290'] },
      { level: 5, courses: ['عال 1322', 'نال 1350', 'نال 1310', 'نال 1321'] },
    ],
    mandatoryUniversity: ['قرأ 1001', 'نحو 1001'],
  }
  const plan = buildPlan({ student })

  it('adds open level 5 courses after level 4, up to the limit', () => {
    expect(plan.eligible.map((c) => c.key)).toEqual(['حسب 1250', 'نال 1241', 'نال 1290', 'عال 1322', 'نال 1321'])
    expect(plan.totalHours).toBe(16)
  })

  it('locks level 5 courses whose prerequisite is taken this term', () => {
    expect(plan.locked).toEqual([
      { key: 'نال 1350', blockedBy: ['حسب 1250'] },
      { key: 'نال 1310', blockedBy: ['نال 1241'] },
    ])
  })

  it('never adds a course that would go over the limit', () => {
    const tight = buildPlan({ student, maxHours: 13 })
    expect(tight.eligible.map((c) => c.key)).toEqual(['حسب 1250', 'نال 1241', 'نال 1290', 'عال 1322'])
    expect(tight.totalHours).toBe(12)
  })
})

describe('buildPlan — states', () => {
  it('marks a withdrawn course with its own reason', () => {
    const plan = buildPlan({ student: studentForState('withdrawn') })
    expect(plan.late[0].reason).toBe('withdrawn')
  })

  it('counts an in-progress course as passed, with a condition', () => {
    const plan = buildPlan({ student: studentForState('in-progress') })
    const pm = plan.eligible.find((c) => c.key === 'نال 1241')
    expect(pm.conditionalOn).toEqual(['نال 1235'])
  })

  it('suggests deferring a chosen requirement first when over 19 hours', () => {
    const plan = buildPlan({ student: studentForState('full'), chosenElectives: ['ذاع 1001'] })
    expect(plan.totalHours).toBe(21)
    expect(plan.overBy).toBe(2)
    expect(plan.deferSuggestion).toBe('ذاع 1001')
  })

  it('never suggests a course that locks a mandatory course', () => {
    const plan = buildPlan({ student: studentForState('full') }) // 19 hours: at the limit
    const tight = buildPlan({ student: studentForState('full'), maxHours: 17 }) // 2 over a 17-hour limit
    expect(plan.overBy).toBe(0)
    expect(tight.deferSuggestion).toBe('احص 1011')
  })

  it('drops a deferred course from the total', () => {
    const plan = buildPlan({ student: studentForState('full'), chosenElectives: ['ذاع 1001'], deferred: ['ذاع 1001'] })
    expect(plan.totalHours).toBe(19)
    expect(plan.overBy).toBe(0)
  })

  it('is empty when nothing is left', () => {
    expect(buildPlan({ student: studentForState('empty') }).isEmpty).toBe(true)
  })
})

describe('openGroups', () => {
  it('keeps only groups that are not complete', () => {
    const groups = openGroups(demoStudent.groups)
    expect(groups.map((g) => g.name)).toEqual(['المهارات التواصلية والشخصية', 'المهارات المهنية وسوق العمل', 'متطلب جامعي ٥'])
    expect(groups[1].remaining).toBe(1)
  })
})

describe('loads', () => {
  it('maps light, medium and heavy to 12, 15 and 19 hours (unknown = heavy)', () => {
    expect(['light', 'medium', 'heavy', 'nonsense'].map(loadHours)).toEqual([12, 15, 19, 19])
  })

  it('fills fewer next-level courses on a lighter load', () => {
    const student = {
      transcript: ['نال 1130', 'نال 1235', 'نال 1200', 'عال 1241', 'عال 1242', 'نال 1220'].map((course) => ({ course, grade: 'ب' })),
      currentLevel: { level: 4, courses: ['حسب 1250', 'نال 1241', 'نال 1290'] },
      remainingLevels: [{ level: 5, courses: ['عال 1322', 'نال 1350', 'نال 1310', 'نال 1321'] }],
      mandatoryUniversity: [],
    }
    const light = buildPlan({ student, maxHours: loadHours('light') })
    expect(light.eligible.map((c) => c.key)).toEqual(['حسب 1250', 'نال 1241', 'نال 1290', 'عال 1322'])
    expect(light.totalHours).toBe(12)
  })

  it('never drops courses of the current level: a light load can go over the limit', () => {
    const plan = buildPlan({ student: demoStudent, maxHours: loadHours('light') })
    expect(plan.overBy).toBeGreaterThan(0)
    expect(plan.maxHours).toBe(12)
  })
})
