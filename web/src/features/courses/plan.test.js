import { describe, it, expect } from 'vitest'
import { buildPlan, gradeStatus, openGroups } from './plan.js'
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

  it('gives 5 courses and 14 of 19 hours', () => {
    expect(plan.courseCount).toBe(5)
    expect(plan.totalHours).toBe(14)
    expect(plan.maxHours).toBe(19)
    expect(plan.remainingHours).toBe(5)
  })

  it('puts the failed course and the missing university course first', () => {
    expect(plan.late.map((c) => c.key)).toEqual(['نال 1200', 'قرأ 1001'])
    expect(plan.late[0].reason).toBe('failed')
  })

  it('locks the two courses that need كفاءات الإدارة', () => {
    expect(plan.locked.map((c) => c.key)).toEqual(['نال 1290', 'عال 1322'])
    expect(plan.locked.every((c) => c.blockedBy.includes('نال 1200'))).toBe(true)
    expect(plan.late[0].locks).toEqual(['نال 1290', 'عال 1322'])
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
    const plan = buildPlan({ student: studentForState('full'), chosenElectives: ['ذاع 1001', 'دار 1001'] })
    expect(plan.totalHours).toBe(21)
    expect(plan.overBy).toBe(2)
    expect(plan.deferSuggestion).toBe('ذاع 1001')
  })

  it('never suggests a course that locks a mandatory course', () => {
    const plan = buildPlan({ student: studentForState('full') }) // 17 hours: under 19
    const tight = buildPlan({ student: studentForState('full'), maxHours: 15 }) // 2 over a 15-hour limit
    expect(plan.overBy).toBe(0)
    expect(['نال 1220', 'نال 1241', 'حسب 1250', 'نال 1200']).not.toContain(tight.deferSuggestion)
  })

  it('drops a deferred course from the total', () => {
    const plan = buildPlan({ student: studentForState('full'), chosenElectives: ['ذاع 1001', 'دار 1001'], deferred: ['ذاع 1001'] })
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
