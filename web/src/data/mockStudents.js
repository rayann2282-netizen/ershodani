// بيانات وهمية لطالب الـ demo. بعدين تجي من قراءة الملفين (الباك اند).
// الطالب منتقل من نظام الثلاث فصول، ولم يتجاوز «كفاءات الإدارة».

export const demoStudent = {
  fullName: 'عبدالرحمن بن سلطان بن محمد الدوسري',
  email: 'a.aldossary@sm.imamu.edu.sa',
  summary: { cumulativeGpa: 3.82, earnedHours: 55, passedCount: 19 },

  // من السجل الأكاديمي: آخر تقدير لكل مادة لها أثر على الخطة.
  transcript: [
    { course: 'عال 1241', grade: 'أ+' },
    { course: 'احص 1011', grade: 'ج+' },
    { course: 'نال 1130', grade: 'ب' },
    { course: 'نال 1235', grade: 'أ' },
    { course: 'عال 1242', grade: 'ب' },
    { course: 'نال 1200', grade: 'هـ' },
  ],

  // من كشف المقررات المتبقية: مواد مستواك الجاي حسب مسارك.
  currentLevel: { level: 4, courses: ['نال 1220', 'نال 1241', 'حسب 1250', 'نال 1290', 'عال 1322'] },

  // متطلبات جامعية إجبارية ما سجلها.
  mandatoryUniversity: ['قرأ 1001'],

  // أقسام المتطلبات الجامعية: المطلوب، وكم خلص، والمواد اللي ما أخذها.
  groups: [
    { name: 'المعارف والقيم الإسلامية', required: 1, passed: 1, options: [] },
    { name: 'المهارات التواصلية والشخصية', required: 1, passed: 0, options: ['ذاع 1001', 'حيا 1001', 'ادب 1001', 'نفس 1001'] },
    { name: 'المهارات المهنية وسوق العمل', required: 2, passed: 1, options: ['دار 1001', 'رحب 1001', 'ادت 1001', 'نجل 1001'] },
    { name: 'متطلب جامعي ٥', required: 2, passed: 1, options: ['بلغ 1001', 'احص 1001', 'نهج 1001'] },
    { name: 'القيم التاريخية والوطنية', required: 2, passed: 2, options: [] },
    { name: 'المقررات الحرة', required: 3, passed: 3, options: [] },
  ],
}

// نسخ من الطالب لعرض الحالات (?state=...).
export function studentForState(state) {
  if (state === 'withdrawn') {
    return { ...demoStudent, transcript: demoStudent.transcript.map((t) => (t.course === 'نال 1200' ? { ...t, grade: 'ع' } : t)) }
  }
  if (state === 'in-progress') {
    return { ...demoStudent, transcript: demoStudent.transcript.map((t) => (t.course === 'نال 1235' ? { ...t, grade: 'م' } : t)) }
  }
  if (state === 'full') {
    return { ...demoStudent, transcript: [...demoStudent.transcript, { course: 'احص 1011', grade: 'ع' }] }
  }
  if (state === 'empty') {
    return { ...demoStudent, currentLevel: { level: null, courses: [] }, mandatoryUniversity: [], transcript: demoStudent.transcript.filter((t) => t.grade !== 'هـ') }
  }
  return demoStudent
}
