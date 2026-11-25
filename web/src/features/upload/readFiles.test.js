import { describe, it, expect, vi } from 'vitest'

// نستبدل قراءة الـ PDF بنسخة وهمية: اسم الملف يحدد نوعه. بيانات مخترعة، مو ملف طالب حقيقي.
vi.mock('../../lib/pdfText.js', () => ({
  PdfError: class extends Error {},
  readPdfPages: async (file) => [{ kind: file.name }],
}))
vi.mock('./rows.js', () => ({ detectKind: (pages) => pages[0].kind }))
vi.mock('./parseReport.js', () => ({ parseReport: () => ({ courses: [] }) }))
vi.mock('./parseTranscript.js', () => ({ parseTranscript: () => ({ transcript: [{ course: 'نال 1130', grade: 'ب' }], summary: {} }) }))

const { readPortalFiles } = await import('./readFiles.js')
const file = (name) => ({ name, type: 'application/pdf' })

describe('readPortalFiles', () => {
  it('reads both files picked together', async () => {
    const result = await readPortalFiles([file('remaining_report'), file('transcript')])
    expect(result.ok).toBe(true)
  })

  it('accepts the files one at a time', async () => {
    const first = await readPortalFiles([file('transcript')])
    expect(first).toMatchObject({ ok: false, problem: 'missing', missing: 'remaining_report' })

    const second = await readPortalFiles([file('remaining_report')], first.found)
    expect(second.ok).toBe(true)
  })
})
