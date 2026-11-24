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

export const EMPTY_PROGRESS = { markedPassed: [], chosenElectives: [], gpaInputs: null }

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
    supabase.from('student_courses').select('course_code').eq('marked_passed', true),
    supabase.from('plans').select('chosen_electives').maybeSingle(),
    supabase.from('gpa_inputs').select('current_gpa, completed_hours, planned_hours, target_gpa').maybeSingle(),
  ])

  const error = courses.error || plan.error || gpa.error
  if (error) {
    console.error('[Ershodani] Could not load progress:', error.message)
    return { ...EMPTY_PROGRESS }
  }

  return {
    markedPassed: courses.data.map((row) => row.course_code),
    chosenElectives: plan.data?.chosen_electives ?? [],
    gpaInputs: toGpaInputs(gpa.data),
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
