// حسبة المعدل المطلوب هالترم (من ٥).
// required = (الهدف × (المجتاز + الجديد) − الحالي × المجتاز) ÷ الجديد

const ceil2 = (n) => Math.ceil(n * 100 - 1e-9) / 100
const floor2 = (n) => Math.floor(n * 100 + 1e-9) / 100

export const GPA_MAX = 5

export function requiredGpa({ current, earnedHours, plannedHours, target }) {
  const need = (target * (earnedHours + plannedHours) - current * earnedHours) / plannedHours
  const maxReach = (current * earnedHours + GPA_MAX * plannedHours) / (earnedHours + plannedHours)

  if (need <= 0) return { status: 'done', required: 0, maxReach: floor2(maxReach) }
  if (need > GPA_MAX) return { status: 'impossible', required: null, maxReach: floor2(maxReach) }
  return { status: 'ok', required: ceil2(need), maxReach: floor2(maxReach) }
}
