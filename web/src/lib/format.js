// الأرقام في الواجهة عربية-هندية، والفاصلة العشرية «٫».
const DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function ar(value, decimals) {
  const text = typeof value === 'number' && decimals !== undefined ? value.toFixed(decimals) : String(value)
  return text.replace('.', '٫').replace(/[0-9]/g, (d) => DIGITS[d])
}

// يقرأ رقم كتبه المستخدم بأرقام عربية أو إنجليزية: «٣٫٨٢» أو «3.82» ← 3.82
// يرجع null لو اللي مكتوب مو رقم.
export function parseNumber(text) {
  const western = String(text)
    .trim()
    .replace(/[٠-٩]/g, (d) => DIGITS.indexOf(d))
    .replace(/[٫,]/g, '.')
  if (western === '' || !/^\d*\.?\d*$/.test(western)) return null
  const n = Number(western)
  return Number.isFinite(n) ? n : null
}

// «نال 1200» ← «نال ١٢٠٠»
export const courseCode = (key) => ar(key)

// «٣ س»
export const hoursShort = (h) => `${ar(h)} س`

// «ساعة وحدة» / «ساعتين» / «٣ ساعات» / «١٤ ساعة»
export function hoursCount(n) {
  if (n === 1) return 'ساعة وحدة'
  if (n === 2) return 'ساعتين'
  if (n >= 3 && n <= 10) return `${ar(n)} ساعات`
  return `${ar(n)} ساعة`
}

// «مادة واحدة» / «مادتين» / «٥ مواد»
export function coursesCount(n) {
  if (n === 1) return 'مادة وحدة'
  if (n === 2) return 'مادتين'
  if (n >= 3 && n <= 10) return `${ar(n)} مواد`
  return `${ar(n)} مادة`
}
