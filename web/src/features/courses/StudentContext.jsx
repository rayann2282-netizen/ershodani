import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { demoStudent } from '../../data/mockStudents.js'
import { EMPTY_PROGRESS, clearProgress, loadProgress, saveProgress } from '../../lib/progressStore.js'
import { useAuth } from '../auth/AuthContext.jsx'

// Context = مكان واحد نحفظ فيه بيانات الطالب، وأي شاشة تقدر تقراها
// بدون ما نمررها من شاشة لشاشة. بيانات الملفين الحين وهمية،
// وتقدّم الطالب (اختياراته) ينحفظ في Supabase عن طريق progressStore.
const StudentContext = createContext(null)

const SAVE_DELAY_MS = 600 // ننتظر شوي بعد آخر تعديل، عشان ما نحفظ مع كل حرف يكتبه

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

  const { markedPassed, chosenElectives, gpaInputs } = progress
  const setMarkedPassed = (list) => setProgress((p) => ({ ...p, markedPassed: list }))
  const setChosenElectives = (list) => setProgress((p) => ({ ...p, chosenElectives: list }))
  const setGpaInputs = (inputs) => setProgress((p) => ({ ...p, gpaInputs: inputs }))
  const resetProgress = async () => {
    await clearProgress(userId)
    lastSaved.current = EMPTY_PROGRESS
    setProgress(EMPTY_PROGRESS)
  }

  // نطبق «لا، خلصتها» على السجل: المادة تصير «ند» (ناجح).
  const student = useMemo(
    () => ({
      ...demoStudent,
      transcript: demoStudent.transcript.map((t) => (markedPassed.includes(t.course) ? { ...t, grade: 'ند' } : t)),
    }),
    [markedPassed],
  )

  const value = { student, loaded, chosenElectives, setChosenElectives, markedPassed, setMarkedPassed, gpaInputs, setGpaInputs, resetProgress }
  // ما نعرض الشاشات قبل ما نقرأ المحفوظ، عشان ما تبدأ فاضية وبعدين تتغيّر.
  return <StudentContext.Provider value={value}>{loaded ? children : null}</StudentContext.Provider>
}

export function useStudent() {
  return useContext(StudentContext)
}
