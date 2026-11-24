import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { demoStudent } from '../../data/mockStudents.js'
import { EMPTY_PROGRESS, clearProgress, loadProgress, saveProgress } from '../../lib/progressStore.js'

// Context = مكان واحد نحفظ فيه بيانات الطالب، وأي شاشة تقدر تقراها
// بدون ما نمررها من شاشة لشاشة. بيانات الملفين الحين وهمية،
// وتقدّم الطالب (اختياراته) ينحفظ عن طريق progressStore.
const StudentContext = createContext(null)

export function StudentProvider({ children }) {
  const [progress, setProgress] = useState(EMPTY_PROGRESS)
  const [loaded, setLoaded] = useState(false)

  // أول ما يفتح الموقع: نقرأ المحفوظ.
  useEffect(() => {
    let active = true
    loadProgress().then((saved) => {
      if (!active) return
      setProgress(saved)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  // كل ما تغيّر شي: نحفظه. ما نحفظ قبل ما نقرأ، عشان ما نمسح المحفوظ بالفاضي.
  useEffect(() => {
    if (loaded) saveProgress(progress)
  }, [progress, loaded])

  const { markedPassed, chosenElectives, gpaInputs } = progress
  const setMarkedPassed = (list) => setProgress((p) => ({ ...p, markedPassed: list }))
  const setChosenElectives = (list) => setProgress((p) => ({ ...p, chosenElectives: list }))
  const setGpaInputs = (inputs) => setProgress((p) => ({ ...p, gpaInputs: inputs }))
  const resetProgress = async () => {
    await clearProgress()
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
