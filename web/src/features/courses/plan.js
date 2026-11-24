// بناء خطة الترم الجاي. دوال "pure": تاخذ بيانات وترجع نتيجة، بدون شاشة ولا إنترنت،
// عشان نقدر نختبرها لحالها (plan.test.js).

import { COURSES, MAX_HOURS, courseHours } from '../../data/studyPlan.js'

// رموز التقديرات الرسمية (رموز التقديرات للمقررات).
const PASSED = ['أ+', 'أ', 'ب+', 'ب', 'ج+', 'ج', 'د+', 'د', 'ند']
const FAILED = ['هـ', 'ح', 'هد']
const WITHDRAWN = ['ع']
const IN_PROGRESS = ['م', 'ل']

export function gradeStatus(grade) {
  if (PASSED.includes(grade)) return 'passed'
  if (FAILED.includes(grade)) return 'failed'
  if (WITHDRAWN.includes(grade)) return 'withdrawn'
  if (IN_PROGRESS.includes(grade)) return 'in-progress'
  return 'unknown'
}

// آخر تقدير لكل مادة (لو أعاد المادة، الأخير هو اللي يحسب).
function latestStatusByCourse(transcript) {
  const map = {}
  for (const entry of transcript) map[entry.course] = gradeStatus(entry.grade)
  return map
}

// هل المادة تقفل مادة إجبارية؟ نستخدمها عشان نقترح وش يتأجل.
function blocksMandatory(key, courses) {
  return Object.values(courses).some((c) => c.type === 'mandatory' && c.prereqs.includes(key))
}

export function buildPlan({ student, chosenElectives = [], deferred = [], courses = COURSES, maxHours = MAX_HOURS }) {
  const status = latestStatusByCourse(student.transcript)
  const isSatisfied = (key) => status[key] === 'passed' || status[key] === 'in-progress'

  // ١. المتأخرة: ما تجاوزها، أو انسحب منها، أو متطلب جامعي إجباري ما سجله.
  const late = []
  for (const [key, s] of Object.entries(status)) {
    if (s === 'failed' || s === 'withdrawn') late.push({ key, reason: s, hours: courseHours(key), locks: [] })
  }
  for (const key of student.mandatoryUniversity) {
    if (!isSatisfied(key)) late.push({ key, reason: 'not_registered', hours: courseHours(key), locks: [] })
  }
  const lateKeys = late.map((c) => c.key)

  // ٢. مواد مستواك: متاحة، أو مقفلة بسبب متطلب ناقص.
  const eligible = []
  const locked = []
  for (const key of student.currentLevel.courses) {
    if (lateKeys.includes(key) || status[key] === 'passed') continue
    const prereqs = courses[key]?.prereqs ?? []
    const blockedBy = prereqs.filter((p) => !isSatisfied(p))
    if (blockedBy.length > 0) {
      locked.push({ key, blockedBy })
    } else {
      const conditionalOn = prereqs.filter((p) => status[p] === 'in-progress')
      eligible.push({ key, hours: courseHours(key), conditionalOn })
    }
  }

  // كل مادة متأخرة: وش المواد اللي قفلتها؟
  for (const item of late) item.locks = locked.filter((l) => l.blockedBy.includes(item.key)).map((l) => l.key)

  // ٣. المتطلبات اللي اختارها، وبعدها نشيل المؤجلة.
  const electives = chosenElectives.map((key) => ({ key, hours: courseHours(key) }))
  const keep = (c) => !deferred.includes(c.key)
  const planned = [...late, ...eligible, ...electives].filter(keep)

  const totalHours = planned.reduce((sum, c) => sum + c.hours, 0)
  const overBy = Math.max(0, totalHours - maxHours)

  // ٤. لو زادت عن الحد: نقترح مادة ما تقفل أي مادة إجبارية، وساعاتها تكفي.
  // نبدأ بالمتطلبات اللي اختارها، بعدها مواد المستوى، وآخر شي المتأخرة.
  let deferSuggestion = null
  if (overBy > 0) {
    const rank = (c) => (chosenElectives.includes(c.key) ? 0 : lateKeys.includes(c.key) ? 2 : 1)
    const candidates = planned
      .filter((c) => c.hours >= overBy && !blocksMandatory(c.key, courses))
      .sort((a, b) => rank(a) - rank(b) || a.hours - b.hours)
    deferSuggestion = candidates[0]?.key ?? null
  }

  return {
    late: late.filter(keep),
    eligible: eligible.filter(keep),
    locked,
    electives: electives.filter(keep),
    totalHours,
    courseCount: planned.length,
    maxHours,
    remainingHours: Math.max(0, maxHours - totalHours),
    overBy,
    deferSuggestion,
    isEmpty: planned.length === 0 && locked.length === 0,
  }
}

// الأقسام اللي ما كمّلها الطالب، وكم باقي من كل قسم.
export function openGroups(groups) {
  return groups
    .filter((g) => g.passed < g.required)
    .map((g) => ({ ...g, remaining: g.required - g.passed }))
}
