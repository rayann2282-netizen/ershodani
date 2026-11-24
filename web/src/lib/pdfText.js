// نقرأ نص ملف PDF داخل المتصفح بـ pdfjs (من Mozilla). الملف ما يطلع من الجوال.
// نحمّل pdfjs بس لما يحتاجه الطالب (dynamic import)، عشان الموقع يفتح أسرع.

export class PdfError extends Error {
  constructor(code, fileName) {
    super(code)
    this.code = code // 'not_pdf' | 'no_text' | 'broken'
    this.fileName = fileName
  }
}

const MIN_TEXT_CHARS = 50 // أقل من كذا = صورة ممسوحة، ما فيها نص

// File ← [{ items: [{ str, x, y }] }]
export async function readPdfPages(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
  if (!isPdf) throw new PdfError('not_pdf', file.name)

  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
  let doc
  try {
    doc = await task.promise
  } catch {
    throw new PdfError('broken', file.name)
  }

  const pages = []
  let chars = 0
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent()
    const items = content.items.filter((it) => it.str).map((it) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }))
    chars += items.reduce((sum, it) => sum + it.str.trim().length, 0)
    pages.push({ items })
  }
  await task.destroy() // نفك الذاكرة

  if (chars < MIN_TEXT_CHARS) throw new PdfError('no_text', file.name)
  return pages
}
