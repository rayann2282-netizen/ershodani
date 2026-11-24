// من الملفين اللي اختارهم الطالب ← بيانات جاهزة، أو خطأ واضح نعرضه.
import { readPdfPages, PdfError } from '../../lib/pdfText.js'
import { detectKind } from './rows.js'
import { parseReport } from './parseReport.js'
import { parseTranscript } from './parseTranscript.js'

// النتيجة وحدة من:
// { ok: true, report, transcript }
// { ok: false, problem: 'unreadable', fileName, slot }      ← صورة، أو PDF بدون نص، أو ملف ثاني
// { ok: false, problem: 'missing', missing: 'transcript' | 'remaining_report' }
export async function readPortalFiles(fileList) {
  const found = {}
  for (const file of Array.from(fileList)) {
    let pages
    try {
      pages = await readPdfPages(file)
    } catch (error) {
      if (error instanceof PdfError) return { ok: false, problem: 'unreadable', fileName: error.fileName, reason: error.code }
      throw error
    }
    const kind = detectKind(pages)
    if (kind === 'unknown') return { ok: false, problem: 'unreadable', fileName: file.name, reason: 'unknown' }
    found[kind] = pages
  }

  if (!found.remaining_report) return { ok: false, problem: 'missing', missing: 'remaining_report' }
  if (!found.transcript) return { ok: false, problem: 'missing', missing: 'transcript' }

  const report = parseReport(found.remaining_report)
  const transcript = parseTranscript(found.transcript)
  // لو القارئ ما لقى ولا مادة، الملف شكله مو مثل المتوقع.
  if (transcript.transcript.length === 0) return { ok: false, problem: 'unreadable', fileName: 'السجل الأكاديمي', reason: 'empty' }
  return { ok: true, report, transcript }
}
