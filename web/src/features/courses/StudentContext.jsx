import { createContext, useContext, useMemo, useState } from 'react'
import { demoStudent } from '../../data/mockStudents.js'

// Context = مكان واحد نحفظ فيه بيانات الطالب، وأي شاشة تقدر تقراها
// بدون ما نمررها من شاشة لشاشة. الحين بيانات وهمية، وبعدين تجي من الملفين.
const StudentContext = createContext(null)

export function StudentProvider({ children }) {
  const [chosenElectives, setChosenElectives] = useState([])
  const [markedPassed, setMarkedPassed] = useState([]) // «لا، خلصتها»

  // نطبق «لا، خلصتها» على السجل: المادة تصير «ند» (ناجح).
  const student = useMemo(
    () => ({
      ...demoStudent,
      transcript: demoStudent.transcript.map((t) => (markedPassed.includes(t.course) ? { ...t, grade: 'ند' } : t)),
    }),
    [markedPassed],
  )

  const value = { student, chosenElectives, setChosenElectives, markedPassed, setMarkedPassed }
  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
}

export function useStudent() {
  return useContext(StudentContext)
}
