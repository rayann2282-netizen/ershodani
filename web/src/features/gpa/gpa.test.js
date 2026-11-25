import { describe, it, expect } from 'vitest'
import { requiredGpa, encouragement } from './gpa.js'

const base = { current: 3.82, earnedHours: 55, plannedHours: 14 }

describe('requiredGpa', () => {
  it('needs 4.71 this semester to reach 4.00', () => {
    expect(requiredGpa({ ...base, target: 4 })).toEqual({ status: 'ok', required: 4.71, maxReach: 4.05 })
  })

  it('says impossible when the target needs more than 5', () => {
    const result = requiredGpa({ ...base, target: 4.25 })
    expect(result.status).toBe('impossible')
    expect(result.maxReach).toBe(4.05)
  })

  it('says done when the target is already reached', () => {
    expect(requiredGpa({ ...base, target: 3 }).status).toBe('done')
  })
})

describe('encouragement', () => {
  it('matches how hard the target is compared with the current GPA', () => {
    expect(encouragement({ status: 'done', required: 0, current: 3.5 }).level).toBe('done')
    expect(encouragement({ status: 'ok', required: 3.4, current: 3.5 }).level).toBe('easy')
    expect(encouragement({ status: 'ok', required: 3.9, current: 3.5 }).level).toBe('stretch')
    expect(encouragement({ status: 'ok', required: 4.66, current: 3.5 }).level).toBe('hard')
    expect(encouragement({ status: 'impossible', required: null, current: 3.5 }).level).toBe('impossible')
  })
})
