// هل شاف شاشة الترحيب قبل؟ نحفظها في المتصفح بس (راحة للطالب، مو بيانات مهمة).
// لو المتصفح ما سمح بالحفظ (وضع خاص مثلاً) نكمل عادي: بأسوأ حال يشوف الترحيب مرة ثانية.
const KEY = 'ershodani.welcomed'

export function hasBeenWelcomed() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomed() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // ما يضر
  }
}
