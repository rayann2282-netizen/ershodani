// بناء خطة الترم الجاي. دوال "pure": تاخذ بيانات وترجع نتيجة، بدون شاشة ولا إنترنت،
// عشان نقدر نختبرها لحالها (plan.test.js).

import { COURSES, EQUIVALENTS, MAX_HOURS, courseHours } from '../../data/studyPlan.js'

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
// المادة القديمة تنحسب باسم مكافئها في الخطة الحالية (مثل «عال 1141» = «عال 1241»).
function latestStatusByCourse(transcript) {
  const map = {}
  for (const entry of transcript) map[EQUIVALENTS[entry.course] ?? entry.course] = gradeStatus(entry.grade)
  return map
}

// هل المادة تقفل مادة إجبارية؟ نستخدمها عشان نقترح وش يتأجل.
function blocksMandatory(key, courses) {
  return Object.values(courses).some((c) => c.type === 'mandatory' && c.prereqs.includes(key))
}

export function buildPlan({ student, chosenElectives = [], deferred = [], courses = COURSES, maxHours = MAX_HOURS }) {
  const status = latestStatusByCourse(student.transcript)
  const isSatisfied = (key) => status[key] === 'passed' || status[key] === 'in-progress'

  // ١. المتأخرة: ما تجاوزها أو انسحب منها. (المتطلبات الجامعية الإجبارية مو متأخرة:
  //    ياخذها أي ترم، فتطلع له في «اختر متطلباتك».)
  const late = []
  for (const [key, s] of Object.entries(status)) {
    if (s === 'failed' || s === 'withdrawn') late.push({ key, reason: s, hours: courseHours(key), locks: [] })
  }
  const lateKeys = late.map((c) => c.key)

  // ٢. مواد مستواك: متاحة، أو مقفلة بسبب متطلب ناقص.
  const eligible = []
  const locked = []
  const prereqsOf = (key) => courses[key]?.prereqs ?? []
  const conditionalOn = (key) => prereqsOf(key).filter((p) => status[p] === 'in-progress')
  for (const key of student.currentLevel.courses) {
    if (lateKeys.includes(key) || status[key] === 'passed') continue
    const blockedBy = prereqsOf(key).filter((p) => !isSatisfied(p))
    if (blockedBy.length > 0) locked.push({ key, blockedBy })
    else eligible.push({ key, hours: courseHours(key), conditionalOn: conditionalOn(key), level: student.currentLevel.level })
  }

  // ٣. لو باقي مكان: نعبّي من المستويات اللي بعده، بترتيب الخطة، لين نوصل الحد.
  //    مادة متطلبها نفسه في خطة هالترم ما ينفع تاخذها معه، فتطلع «مقفلة» بس للمستوى اللي بعده مباشرة.
  const thisTerm = new Set([...lateKeys, ...eligible.map((c) => c.key)])
  let used = [...late, ...eligible].reduce((sum, c) => sum + c.hours, 0)
  const laterLevels = (student.remainingLevels ?? []).filter((l) => l.level > (student.currentLevel.level ?? 0))
  laterLevels.forEach((lvl, index) => {
    for (const key of lvl.courses) {
      if (thisTerm.has(key) || status[key] === 'passed') continue
      const blockedBy = prereqsOf(key).filter((p) => !isSatisfied(p))
      if (blockedBy.length > 0) {
        // نعرض المقفلة بس من المستوى اللي بعده مباشرة، عشان القائمة ما تطول.
        if (index === 0 && blockedBy.every((p) => thisTerm.has(p))) locked.push({ key, blockedBy })
        continue
      }
      const hours = courseHours(key)
      if (used + hours > maxHours) continue
      eligible.push({ key, hours, conditionalOn: conditionalOn(key), level: lvl.level })
      thisTerm.add(key)
      used += hours
    }
  })

  // كل مادة متأخرة: وش المواد اللي قفلتها؟
  for (const item of late) item.locks = locked.filter((l) => l.blockedBy.includes(item.key)).map((l) => l.key)

  // ٤. المتطلبات اللي اختارها، وبعدها نشيل المؤجلة.
  const electives = chosenElectives.map((key) => ({ key, hours: courseHours(key) }))
  const keep = (c) => !deferred.includes(c.key)
  const planned = [...late, ...eligible, ...electives].filter(keep)

  const totalHours = planned.reduce((sum, c) => sum + c.hours, 0)
  const overBy = Math.max(0, totalHours - maxHours)

  // ٥. لو زادت عن الحد: نقترح مادة ما تقفل أي مادة إجبارية، وساعاتها تكفي.
  // نبدأ بالمتطلبات اللي اختارها، بعدها مواد المستوى الجاي، بعدها مستواك، وآخر شي المتأخرة.
  let deferSuggestion = null
  if (overBy > 0) {
    const currentLevel = student.currentLevel.level
    const rank = (c) => (chosenElectives.includes(c.key) ? 0 : lateKeys.includes(c.key) ? 3 : c.level && c.level !== currentLevel ? 1 : 2)
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

// الحمل اللي يبيه الطالب هالترم (قصة Should في PRD). «ثقيل» = الحد الأعلى (١٩)، وهو الأصل.
export const LOADS = [
  { key: 'light', label: 'خفيف', hours: 12 },
  { key: 'medium', label: 'متوسط', hours: 15 },
  { key: 'heavy', label: 'ثقيل', hours: MAX_HOURS },
]
export const DEFAULT_LOAD = 'heavy'
export const loadHours = (key) => (LOADS.find((l) => l.key === key) ?? LOADS.find((l) => l.key === DEFAULT_LOAD)).hours

// لو شال الطالب مادة من خطته: وش المواد اللي بتتقفل عليه بسببها؟
// كل مادة متطلبها هذي المادة، وبعدها اللي متطلبها هذيك (سلسلة)، ما عدا اللي خلّصها.
// مرتبة: اللي تتقفل مباشرة أول، بعدها اللي وراها.
export function locksIfRemoved(key, student, courses = COURSES) {
  const status = latestStatusByCourse(student.transcript)
  const locked = []
  const queue = [key]
  while (queue.length > 0) {
    const current = queue.shift()
    for (const [course, info] of Object.entries(courses)) {
      if (course === key || locked.includes(course) || status[course] === 'passed') continue
      if (info.prereqs.includes(current)) {
        locked.push(course)
        queue.push(course)
      }
    }
  }
  return locked
}
