import { describe, it, expect } from 'vitest'
import { requiredGpa } from './gpa.js'

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
