// حفظ تقدّم الطالب في Supabase. الشاشات ما تعرف وين ينحفظ: تكلم هذا الملف بس.
// (قبل كان localStorage، وتغيّر هالملف بس، والشاشات بقت زي ما هي.)
//
// شكل البيانات اللي تشوفه الشاشات (ما تغيّر):
// {
//   markedPassed: ['نال 1200'],            // «لا، خلصتها»             ← student_courses.marked_passed
//   chosenElectives: ['ذاع 1001'],         // المتطلبات اللي اختارها   ← plans.chosen_electives
//   gpaInputs: { current, earned, planned, target } | null   // نصوص صفحة المعدل ← gpa_inputs
// }
// في gpaInputs: الحقل يكون null لو الطالب ما عدّله، عشان ياخذ رقم ملفاته.
//
// الحماية: Row Level Security في قاعدة البيانات يخلي كل طالب يشوف صفوفه بس.

import { supabase } from './supabaseClient.js'
import { ar, parseNumber } from './format.js'

// record = اللي قريناه من ملفاته (السجل والكشف)، أو null لو ما رفع للحين.
export const EMPTY_PROGRESS = { markedPassed: [], chosenElectives: [], gpaInputs: null, record: null }

// ---------- قاعدة البيانات ← شكل الشاشة ----------

function toGpaInputs(row) {
  if (!row) return null
  const num = (value, decimals) => (value === null || value === undefined ? null : ar(Number(value), decimals))
  return {
    current: num(row.current_gpa, 2),
    earned: num(row.completed_hours),
    planned: num(row.planned_hours),
    target: num(row.target_gpa, 2),
  }
}

// ---------- شكل الشاشة ← قاعدة البيانات ----------
// نحفظ بس الأرقام الصحيحة. لو الطالب في نص الكتابة (مثل «٣٫»)، نتجاهل هالحقل لين يكمل.

function gpaValue(text, { min, max, integer = false }) {
  if (text === null || text === undefined) return null // null = خذ رقم الملفات
  const n = parseNumber(text)
  if (n === null || n < min || n > max) return undefined // undefined = لا تحفظ هالحقل الحين
  if (integer && !Number.isInteger(n)) return undefined
  return n
}

function toGpaRow(inputs) {
  if (!inputs) return null
  const row = {
    current_gpa: gpaValue(inputs.current, { min: 0, max: 5 }),
    completed_hours: gpaValue(inputs.earned, { min: 0, max: 300, integer: true }),
    planned_hours: gpaValue(inputs.planned, { min: 1, max: 30, integer: true }),
    target_gpa: gpaValue(inputs.target, { min: 0, max: 5 }),
  }
  // نشيل الحقول اللي ما نبي نحفظها الحين.
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined))
}

// ---------- الدوال اللي تستخدمها الشاشات ----------

export async function loadProgress(userId) {
  if (!userId) return { ...EMPTY_PROGRESS }

  const [courses, plan, gpa] = await Promise.all([
    supabase.from('student_courses').select('course_code, grade, term, marked_passed'),
    supabase
      .from('plans')
      .select('current_level, level_courses, remaining_levels, mandatory_university, requirement_groups, cumulative_gpa, earned_hours, chosen_electives, report_read_at')
      .maybeSingle(),
    supabase.from('gpa_inputs').select('current_gpa, completed_hours, planned_hours, target_gpa').maybeSingle(),
  ])

  const error = courses.error || plan.error || gpa.error
  if (error) {
    console.error('[Ershodani] Could not load progress:', error.message)
    return { ...EMPTY_PROGRESS }
  }

  const p = plan.data
  return {
    markedPassed: courses.data.filter((row) => row.marked_passed).map((row) => row.course_code),
    chosenElectives: p?.chosen_electives ?? [],
    gpaInputs: toGpaInputs(gpa.data),
    record: p?.report_read_at
      ? {
          transcript: courses.data.map((row) => ({ course: row.course_code, grade: row.grade, term: row.term })),
          currentLevel: { level: p.current_level, courses: p.level_courses },
          remainingLevels: p.remaining_levels ?? [],
          mandatoryUniversity: p.mandatory_university,
          groups: p.requirement_groups,
          summary: { cumulativeGpa: p.cumulative_gpa === null ? null : Number(p.cumulative_gpa), earnedHours: p.earned_hours ?? 0 },
          readAt: p.report_read_at,
        }
      : null,
  }
}

// الطالب رفع ملفات جديدة: نبدّل القديم كامل (قرار ٢٦).
// «لا، خلصتها» تبقى بس للمواد اللي لسا ما تجاوزها، والمتطلبات المختارة تبقى بس لو لسا مفتوحة.
// يرجع { error } لو فشل، أو { record, markedPassed, chosenElectives } الجديدة.
export async function saveUpload(userId, { report, transcript }, previous) {
  const passedNow = new Set(transcript.transcript.filter((t) => !['هـ', 'ح', 'هد', 'ع'].includes(t.grade)).map((t) => t.course))
  const markedPassed = previous.markedPassed.filter((c) => !passedNow.has(c))
  const openOptions = new Set([...report.groups.flatMap((g) => g.options), ...report.mandatoryUniversity])
  const chosenElectives = previous.chosenElectives.filter((c) => openOptions.has(c))
  const readAt = new Date().toISOString()

  // ١. نشيل مواد السجل القديم (ونخلي اللي علّمها بيده).
  const removeOld = await supabase.from('student_courses').delete().eq('marked_passed', false)
  if (removeOld.error) return { error: removeOld.error }

  // ٢. مواد السجل الجديد. الصف اللي علّمه بيده يبقى معلّم (ما نرسل marked_passed).
  const rows = transcript.transcript.map((t) => ({ user_id: userId, course_code: t.course, grade: t.grade, term: t.term }))
  const insert = rows.length ? await supabase.from('student_courses').upsert(rows, { onConflict: 'user_id,course_code' }) : { error: null }
  if (insert.error) return { error: insert.error }

  // ٣. المواد اللي صار يتجاوزها ما تحتاج «لا، خلصتها».
  if (passedNow.size) {
    const unmark = await supabase.from('student_courses').update({ marked_passed: false }).in('course_code', [...passedNow]).eq('marked_passed', true)
    if (unmark.error) return { error: unmark.error }
  }

  // ٤. الكشف.
  const plan = await supabase.from('plans').upsert(
    {
      user_id: userId,
      current_level: report.currentLevel.level,
      level_courses: report.currentLevel.courses,
      remaining_levels: report.remainingLevels,
      mandatory_university: report.mandatoryUniversity,
      requirement_groups: report.groups,
      cumulative_gpa: transcript.summary.cumulativeGpa,
      earned_hours: transcript.summary.earnedHours,
      chosen_electives: chosenElectives,
      report_read_at: readAt,
    },
    { onConflict: 'user_id' },
  )
  if (plan.error) return { error: plan.error }

  return {
    markedPassed,
    chosenElectives,
    record: {
      transcript: transcript.transcript,
      currentLevel: report.currentLevel,
      remainingLevels: report.remainingLevels,
      mandatoryUniversity: report.mandatoryUniversity,
      groups: report.groups,
      summary: { cumulativeGpa: transcript.summary.cumulativeGpa, earnedHours: transcript.summary.earnedHours },
      readAt,
    },
  }
}

// نحفظ الفرق بس: وش انضاف ووش انشال من «لا، خلصتها».
export async function saveProgress(userId, progress, previous = EMPTY_PROGRESS) {
  if (!userId) return
  const tasks = []

  // ١. «لا، خلصتها»
  const added = progress.markedPassed.filter((c) => !previous.markedPassed.includes(c))
  const removed = previous.markedPassed.filter((c) => !progress.markedPassed.includes(c))
  if (added.length) {
    tasks.push(
      supabase
        .from('student_courses')
        .upsert(added.map((course_code) => ({ user_id: userId, course_code, marked_passed: true })), { onConflict: 'user_id,course_code' }),
    )
  }
  if (removed.length) {
    // المادة اللي أضافها بيده (ما لها تقدير) تنحذف، واللي من السجل نرجعها غير معلّمة.
    tasks.push(supabase.from('student_courses').delete().in('course_code', removed).is('grade', null))
    tasks.push(supabase.from('student_courses').update({ marked_passed: false }).in('course_code', removed).not('grade', 'is', null))
  }

  // ٢. المتطلبات اللي اختارها
  if (progress.chosenElectives.join() !== previous.chosenElectives.join()) {
    tasks.push(supabase.from('plans').upsert({ user_id: userId, chosen_electives: progress.chosenElectives }, { onConflict: 'user_id' }))
  }

  // ٣. أرقام صفحة المعدل
  if (JSON.stringify(progress.gpaInputs) !== JSON.stringify(previous.gpaInputs)) {
    const row = toGpaRow(progress.gpaInputs)
    if (row === null) tasks.push(supabase.from('gpa_inputs').delete().eq('user_id', userId))
    else if (Object.keys(row).length) tasks.push(supabase.from('gpa_inputs').upsert({ user_id: userId, ...row }, { onConflict: 'user_id' }))
  }

  const results = await Promise.all(tasks)
  const failed = results.find((r) => r.error)
  if (failed) console.error('[Ershodani] Could not save progress:', failed.error.message)
}

export async function clearProgress(userId) {
  if (!userId) return
  await Promise.all([
    supabase.from('student_courses').delete().eq('marked_passed', true).is('grade', null),
    supabase.from('student_courses').update({ marked_passed: false }).eq('marked_passed', true).not('grade', 'is', null),
    supabase.from('plans').update({ chosen_electives: [] }).eq('user_id', userId),
    supabase.from('gpa_inputs').delete().eq('user_id', userId),
  ])
}
