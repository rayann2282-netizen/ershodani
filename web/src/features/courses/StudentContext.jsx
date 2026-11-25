import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { demoStudent } from '../../data/mockStudents.js'
import { registerCourseNames } from '../../data/studyPlan.js'
import { EMPTY_PROGRESS, clearProgress, loadProgress, saveProgress, saveUpload } from '../../lib/progressStore.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { DEFAULT_LOAD, gradeStatus, loadHours } from './plan.js'

// Context = مكان واحد نحفظ فيه بيانات الطالب، وأي شاشة تقدر تقراها
// بدون ما نمررها من شاشة لشاشة. كل شي ينحفظ في Supabase عن طريق progressStore.
const StudentContext = createContext(null)

const SAVE_DELAY_MS = 600 // ننتظر شوي بعد آخر تعديل، عشان ما نحفظ مع كل حرف يكتبه

// المتطلبات الجامعية الإجبارية (القرآن، المهارات اللغوية) ياخذها أي ترم،
// فنحطها أول قسم في «اختر متطلباتك» بدل ما تكون «متأخرة».
export function withMandatoryGroup(groups, mandatoryUniversity) {
  if (!mandatoryUniversity?.length) return groups
  return [{ name: 'متطلب جامعي إجباري', required: mandatoryUniversity.length, passed: 0, options: mandatoryUniversity, names: {} }, ...groups]
}

// من اللي قريناه من ملفاته ← نفس شكل الطالب اللي تستخدمه الخطة.
function studentFromRecord(record, markedPassed) {
  const transcript = record.transcript.map((t) => (markedPassed.includes(t.course) ? { ...t, grade: 'ند' } : t))
  return {
    transcript,
    currentLevel: record.currentLevel,
    remainingLevels: record.remainingLevels ?? [],
    mandatoryUniversity: record.mandatoryUniversity,
    groups: withMandatoryGroup(record.groups, record.mandatoryUniversity),
    summary: {
      cumulativeGpa: record.summary.cumulativeGpa,
      earnedHours: record.summary.earnedHours,
      passedCount: transcript.filter((t) => gradeStatus(t.grade) === 'passed').length,
    },
  }
}

export function StudentProvider({ children }) {
  const { user, ready } = useAuth()
  const userId = user?.id ?? null
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [loaded, setLoaded] = useState(false)
  const lastSaved = useRef(EMPTY_PROGRESS) // آخر شي انحفظ، عشان نحفظ الفرق بس

  // كل ما تغيّر الطالب (دخل، طلع، أو دخل حساب ثاني): نقرأ بياناته من جديد.
  useEffect(() => {
    if (!ready) return
    let active = true
    setLoaded(false)
    loadProgress(userId).then((saved) => {
      if (!active) return
      saved.record?.groups?.forEach((g) => registerCourseNames(g.names))
      lastSaved.current = saved
      setProgress(saved)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [userId, ready])

  // كل ما تغيّر شي: نحفظه بعد شوي. ما نحفظ قبل ما نقرأ، عشان ما نمسح المحفوظ بالفاضي.
  useEffect(() => {
    if (!loaded || !userId || progress === lastSaved.current) return
    const timer = setTimeout(() => {
      const previous = lastSaved.current
      lastSaved.current = progress
      saveProgress(userId, progress, previous)
    }, SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [progress, loaded, userId])

  const { markedPassed, chosenElectives, gpaInputs, record } = progress
  const setMarkedPassed = (list) => setProgress((p) => ({ ...p, markedPassed: list }))
  const setChosenElectives = (list) => setProgress((p) => ({ ...p, chosenElectives: list }))
  const setGpaInputs = (inputs) => setProgress((p) => ({ ...p, gpaInputs: inputs }))
  const resetProgress = async () => {
    await clearProgress(userId)
    const next = { ...EMPTY_PROGRESS, record }
    lastSaved.current = next
    setProgress(next)
  }

  // الطالب رفع ملفين وانقروا: نحفظهم ونبدّل القديم. يرجع رسالة خطأ أو null.
  async function applyUpload(parsed) {
    const result = await saveUpload(userId, parsed, progress)
    if (result.error) {
      console.error('[Ershodani] Could not save the files:', result.error.message)
      return 'offline'
    }
    result.record.groups.forEach((g) => registerCourseNames(g.names))
    const next = { ...progress, record: result.record, markedPassed: result.markedPassed, chosenElectives: result.chosenElectives }
    lastSaved.current = next
    setProgress(next)
    return null
  }

  // بيانات الطالب الحقيقية لو رفع ملفاته. الطالب الوهمي بس لصفحات التجربة (?state=...).
  const student = useMemo(
    () => (record ? studentFromRecord(record, markedPassed) : { ...demoStudent, groups: withMandatoryGroup(demoStudent.groups, demoStudent.mandatoryUniversity) }),
    [record, markedPassed],
  )

  // الحمل (خفيف، متوسط، ثقيل): نحفظه في المتصفح لكل حساب، راحة للطالب بس.
  const [load, setLoadState] = useState(DEFAULT_LOAD)
  useEffect(() => {
    try {
      setLoadState(localStorage.getItem(`ershodani.load.${userId}`) ?? DEFAULT_LOAD)
    } catch {
      setLoadState(DEFAULT_LOAD)
    }
  }, [userId])
  function setLoad(next) {
    setLoadState(next)
    try {
      localStorage.setItem(`ershodani.load.${userId}`, next)
    } catch {
      // المتصفح ما سمح بالحفظ: يبقى لين يسكّر الصفحة
    }
  }

  const value = { student, hasRecord: Boolean(record), loaded, chosenElectives, setChosenElectives, markedPassed, setMarkedPassed, gpaInputs, setGpaInputs, resetProgress, applyUpload, load, setLoad, maxHours: loadHours(load) }
  // ما نعرض الشاشات قبل ما نقرأ المحفوظ، عشان ما تبدأ فاضية وبعدين تتغيّر.
  return <StudentContext.Provider value={value}>{loaded ? children : null}</StudentContext.Provider>
}

export function useStudent() {
  return useContext(StudentContext)
}
