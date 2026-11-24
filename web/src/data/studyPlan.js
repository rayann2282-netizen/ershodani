// خطة نظم المعلومات (نظام الفصلين) — من ملف «نهائي الخطة الدراسية بكالوريوس نظم المعلومات».
// المتطلبات السابقة من عمود «متطلبات الخطة الحالية» في ملف المواءمة.
// كل مادة لها مفتاح ثابت مثل «نال 1200» (الرمز + رقم المادة بأرقام إنجليزية).

export const MAX_HOURS = 19

export const COURSES = {
  // المستوى ١
  'عال 1111': { name: 'أساسيات الحوسبة والأخلاقيات', hours: 3, level: 1, type: 'mandatory', prereqs: [] },
  'ريض 1112': { name: 'حساب التفاضل والتكامل التطبيقي ١', hours: 4, level: 1, type: 'mandatory', prereqs: [] },
  'فيز 1103': { name: 'الفيزياء العامة', hours: 3, level: 1, type: 'mandatory', prereqs: [] },
  'قرأ 1001': { name: 'القرآن الكريم', hours: 2, level: 1, type: 'university', prereqs: [] },
  'نحو 1001': { name: 'المهارات اللغوية', hours: 2, level: 1, type: 'university', prereqs: [] },
  // المستوى ٢
  'عال 1140': { name: 'مقدمة في برمجة الحاسب', hours: 4, level: 2, type: 'mandatory', prereqs: ['عال 1111'] },
  'عال 1100': { name: 'تراكيب محددة ١', hours: 3, level: 2, type: 'mandatory', prereqs: ['عال 1111'] },
  'ريض 1113': { name: 'حساب التفاضل والتكامل التطبيقي ٢', hours: 4, level: 2, type: 'mandatory', prereqs: ['ريض 1112'] },
  'نال 1130': { name: 'هندسة المتطلبات', hours: 3, level: 2, type: 'mandatory', prereqs: [] },
  'نجل 1050': { name: 'اللغة الإنجليزية', hours: 3, level: 2, type: 'mandatory', prereqs: [] },
  // المستوى ٣
  'عال 1241': { name: 'البرمجة الشيئية', hours: 4, level: 3, type: 'mandatory', prereqs: ['عال 1140'] },
  'احص 1011': { name: 'مقدمة في الاحتمالات والإحصاء', hours: 3, level: 3, type: 'mandatory', prereqs: ['ريض 1113'] },
  'نال 1235': { name: 'تحليل وتصميم النظم', hours: 3, level: 3, type: 'mandatory', prereqs: ['نال 1130'] },
  'نال 1200': { name: 'كفاءات الإدارة', hours: 2, level: 3, type: 'mandatory', prereqs: ['نال 1130'] },
  // المستوى ٤
  'عال 1242': { name: 'تراكيب البيانات', hours: 4, level: 4, type: 'mandatory', prereqs: ['عال 1241'] },
  'نال 1241': { name: 'مبادئ إدارة المشاريع', hours: 3, level: 4, type: 'mandatory', prereqs: ['نال 1235'] },
  'نال 1220': { name: 'مقدمة في قواعد البيانات', hours: 4, level: 4, type: 'mandatory', prereqs: ['نال 1130'] },
  'نال 1290': { name: 'علاقات الأعمال', hours: 2, level: 4, type: 'mandatory', prereqs: ['نال 1200'] },
  'حسب 1250': { name: 'مبادئ المحاسبة والتقارير المالية', hours: 3, level: 4, type: 'mandatory', prereqs: [] },
  // المستوى ٥
  // من الخطة النهائية وملف «المقررات المكافئة» المنشور: عال 1242 + نال 1130 (مو نال 1200).
  'عال 1322': { name: 'أنظمة التشغيل', hours: 4, level: 5, type: 'mandatory', prereqs: ['عال 1242', 'نال 1130'] },
  'نال 1350': { name: 'الفنتك: أسس وتطبيقات', hours: 3, level: 5, type: 'mandatory', prereqs: ['نال 1235', 'حسب 1250'] },
  'نال 1310': { name: 'بنية المؤسسات', hours: 3, level: 5, type: 'mandatory', prereqs: ['نال 1241'] },
  'نال 1321': { name: 'نظم إدارة قواعد البيانات', hours: 4, level: 5, type: 'mandatory', prereqs: ['نال 1220'] },
  // المستوى ٦
  'نال 1330': { name: 'أساسيات شبكات البيانات', hours: 4, level: 6, type: 'mandatory', prereqs: ['عال 1322'] },
  'نال 1341': { name: 'البنية التحتية لتقنية المعلومات', hours: 3, level: 6, type: 'mandatory', prereqs: ['عال 1322'] },
  'نال 1382': { name: 'استراتيجية ونماذج الأعمال', hours: 3, level: 6, type: 'mandatory', prereqs: ['نال 1310'] },
  'نال 1337': { name: 'تطوير التطبيقات', hours: 3, level: 6, type: 'mandatory', prereqs: ['نال 1321'] },
  // المستوى ٧
  'نال 1480': { name: 'مشروع التخرج ١', hours: 3, level: 7, type: 'mandatory', prereqs: ['نال 1241', 'نال 1290', 'نال 1337'] },
  'نال 1489': { name: 'أمن المعلومات', hours: 3, level: 7, type: 'mandatory', prereqs: ['نال 1330'] },
  'نال 1460': { name: 'الأعمال الإلكترونية', hours: 3, level: 7, type: 'mandatory', prereqs: ['نال 1337'] },
  // المستوى ٨
  'نال 1483': { name: 'مشروع التخرج ٢', hours: 4, level: 8, type: 'mandatory', prereqs: ['نال 1480'] },
  'نال 1497': { name: 'التدريب التعاوني', hours: 4, level: 8, type: 'mandatory', prereqs: ['نال 1235', 'نال 1321', 'نال 1330', 'نال 1290'] },
}

// المواد المكافئة: رمز قديم (خطة الثلاث فصول) ← المادة في الخطة الحالية.
// من «المقررات المكافئة نظم المعلومات مع المتطلبات» (للنشر). المواد الإجبارية بس،
// والرموز الثلاثية (الخطط القديمة جداً F–H) برا الـ MVP.
export const EQUIVALENTS = {
  'عال 1110': 'عال 1111',
  'نجل 1041': 'نجل 1050',
  'عال 1141': 'عال 1241',
  'نال 1340': 'نال 1241',
  'نال 1390': 'نال 1290',
  'عال 1222': 'عال 1322',
  'نال 1250': 'نال 1350',
  'نال 1221': 'نال 1321',
  'نال 1240': 'نال 1341',
  'نال 1494': 'نال 1480',
  'نال 1389': 'نال 1489',
  'نال 1360': 'نال 1460',
  'نال 1495': 'نال 1483',
  'نال 1498': 'نال 1497',
  'نال 1499': 'نال 1497',
}

// أقسام المتطلبات الجامعية — من «كشف المقررات المتبقية».
export const UNIVERSITY_COURSES = {
  'ذاع 1001': 'مهارات الاتصال',
  'حيا 1001': 'الثقافة الصحية',
  'ادب 1001': 'مهارات التحرير والخطاب',
  'نفس 1001': 'الصحة النفسية',
  'رحب 1001': 'قيم العمل وأخلاقياته',
  'دار 1001': 'الابتكار وريادة الأعمال',
  'نجل 1001': 'مهارات اللغة الإنجليزية',
  'ادت 1001': 'مهارات القيادة',
  'احص 1001': 'أساسيات الإحصاء',
  'بلغ 1001': 'مهارات القراءة',
  'نهج 1001': 'مهارات التعلم الجامعي',
  'اصت 1001': 'مهارات التفكير',
}

export const UNIVERSITY_COURSE_HOURS = 2

// أسماء مواد قريناها من كشف الطالب وما هي في القائمة فوق (مثل «علق 1308»).
export function registerCourseNames(names) {
  for (const [key, name] of Object.entries(names ?? {})) if (!COURSES[key] && !UNIVERSITY_COURSES[key]) UNIVERSITY_COURSES[key] = name
}

// اسم المادة من المفتاح، سواء كانت إجبارية أو متطلب جامعي.
export function courseName(key) {
  return COURSES[key]?.name ?? UNIVERSITY_COURSES[key] ?? key
}

export function courseHours(key) {
  return COURSES[key]?.hours ?? UNIVERSITY_COURSE_HOURS
}
