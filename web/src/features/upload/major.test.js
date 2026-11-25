import { describe, it, expect } from 'vitest'
import { detectMajor, isInformationSystems } from './major.js'

// صفوف مخترعة بنفس شكل ملفات البوابة (مو ملف طالب حقيقي). كل عنصر: نص ومكانه في الصفحة.
const page = (...rows) => [{ items: rows.flatMap((cells, i) => cells.map((str, j) => ({ str, x: 500 - j * 120, y: 700 - i * 20 }))) }]

describe('detectMajor', () => {
  it('reads the major from the remaining-courses report', () => {
    const pages = page(['رمز البرنامج', 'بكا-عال نظم', 'وصف البرنامج', 'بكالوريوس نظم معلومات'])
    expect(detectMajor(pages, 'remaining_report')).toBe('نظم معلومات')
  })

  it('reads the major from the transcript, even with stretched letters', () => {
    const pages = page(['الكليـــــة : علوم الحاسب والمعلومات', 'الدرجــة: بكالوريوس', 'التـخصص : نظم المعلومات'])
    expect(detectMajor(pages, 'transcript')).toBe('نظم المعلومات')
  })

  it('finds another major', () => {
    const pages = page(['الكليـــــة : علوم الحاسب والمعلومات', 'الدرجــة: بكالوريوس', 'التـخصص : علوم الحاسب'])
    const major = detectMajor(pages, 'transcript')
    expect(major).toBe('علوم الحاسب')
    expect(isInformationSystems(major)).toBe(false)
  })

  it('returns null when the file has no major line', () => {
    expect(detectMajor(page(['سجل الطالب الأكاديمي']), 'transcript')).toBe(null)
  })
})

describe('isInformationSystems', () => {
  it('accepts both spellings', () => {
    expect(isInformationSystems('نظم معلومات')).toBe(true)
    expect(isInformationSystems('نظم المعلومات')).toBe(true)
  })
})
