// حفظ تقدّم الطالب. الحين في المتصفح (localStorage)، وبعدين قاعدة بيانات.
// الشاشات ما تعرف وين ينحفظ: تكلم هذا الملف بس. لما يجي Supabase، نغيّر
// داخل هالدوال الثلاث وبس، والشاشات تبقى زي ما هي.
//
// الدوال async (ترجع Promise) من الحين، لأن قاعدة البيانات بتكون async.
//
// شكل البيانات:
// {
//   markedPassed: ['نال 1200'],            // «لا، خلصتها»
//   chosenElectives: ['ذاع 1001'],         // المتطلبات اللي اختارها
//   gpaInputs: { current, earned, planned, target } | null   // نصوص صفحة المعدل
// }
// في gpaInputs: الحقل يكون null لو الطالب ما عدّله، عشان ياخذ رقم ملفاته الجديد.

const KEY = 'ershodani.progress.v1'

export const EMPTY_PROGRESS = { markedPassed: [], chosenElectives: [], gpaInputs: null }

const isStringList = (value) => Array.isArray(value) && value.every((v) => typeof v === 'string')

// نتأكد إن اللي انقرأ شكله صح، ولو فيه شي غلط نرجع للفاضي بدل ما يطيح الموقع.
function clean(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_PROGRESS }
  const gpa = raw.gpaInputs
  const gpaOk = gpa && typeof gpa === 'object' && ['current', 'earned', 'planned', 'target'].every((k) => gpa[k] === null || typeof gpa[k] === 'string')
  return {
    markedPassed: isStringList(raw.markedPassed) ? raw.markedPassed : [],
    chosenElectives: isStringList(raw.chosenElectives) ? raw.chosenElectives : [],
    gpaInputs: gpaOk ? gpa : null,
  }
}

export async function loadProgress() {
  try {
    const text = localStorage.getItem(KEY)
    return text ? clean(JSON.parse(text)) : { ...EMPTY_PROGRESS }
  } catch {
    // وضع التصفح الخاص أو بيانات خربانة: نبدأ من جديد بهدوء.
    return { ...EMPTY_PROGRESS }
  }
}

export async function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(clean(progress)))
  } catch {
    // المتصفح منع الحفظ: الموقع يكمل يشتغل، بس ما يتذكر بعد إعادة التحميل.
  }
}

export async function clearProgress() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ما فيه شي نسويه
  }
}
