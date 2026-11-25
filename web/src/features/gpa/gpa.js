// حسبة المعدل المطلوب هالترم (من ٥).
// required = (الهدف × (المجتاز + الجديد) − الحالي × المجتاز) ÷ الجديد

const ceil2 = (n) => Math.ceil(n * 100 - 1e-9) / 100
const floor2 = (n) => Math.floor(n * 100 + 1e-9) / 100

export const GPA_MAX = 5

export function requiredGpa({ current, earnedHours, plannedHours, target }) {
  const need = (target * (earnedHours + plannedHours) - current * earnedHours) / plannedHours
  const maxReach = (current * earnedHours + GPA_MAX * plannedHours) / (earnedHours + plannedHours)

  if (need <= 0) return { status: 'done', required: 0, maxReach: floor2(maxReach) }
  if (need > GPA_MAX) return { status: 'impossible', required: null, maxReach: floor2(maxReach) }
  return { status: 'ok', required: ceil2(need), maxReach: floor2(maxReach) }
}

// كلمة تشجيع حسب صعوبة الهدف، مقارنة بمعدله الحين (نفس النبرة: صاحب يساعدك).
//   done        ← هدفك محقق
//   aim-higher  ← المطلوب أقل من ٣٫٧٥: نقول له يقدر يجيب أكثر
//   easy        ← المطلوب أقل من أو يساوي معدلك الحين
//   stretch     ← أعلى من معدلك بنص درجة أو أقل
//   hard        ← أعلى من كذا، بس أقل من ٥
//   impossible  ← فوق ٥
export const AIM_HIGHER_BELOW = 3.75

export function encouragement({ status, required, current }) {
  if (status === 'done') return { level: 'done', text: 'هدفك محقق أصلاً 🎉 حافظ على مستواك.' }
  if (status === 'impossible') return { level: 'impossible', text: 'هالهدف ما يجي في ترم واحد، بس يجي على ترمين. لا تيأس.' }
  if (required < AIM_HIGHER_BELOW) return { level: 'aim-higher', text: 'ترا تقدر تجيب أكثر من كذا 💪 جرّب ترفع هدفك.' }
  if (required <= current) return { level: 'easy', text: 'تقدر عليها 💪 نفس مستواك أو أقل.' }
  if (required - current <= 0.5) return { level: 'stretch', text: 'تحتاج ترفع شوي عن مستواك. ركّز على المواد اللي ساعاتها أكثر.' }
  return { level: 'hard', text: 'صعبة بس ممكنة 🔥 تحتاج أعلى تقدير في أغلب موادك.' }
}
