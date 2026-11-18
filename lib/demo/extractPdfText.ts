// Ekstraksi teks PDF di browser (mode demo + mode Supabase).
// pdfjs-dist di-import dinamis supaya tidak masuk bundle halaman lain,
// dan worker-nya disajikan dari /pdf.worker.min.mjs (disalin ke public/
// oleh `npm run copy-pdf-worker` saat build — lihat scripts/).
// Dibatasi 50 halaman / 120 ribu karakter agar payload ke
// /api/summarize tetap waras.

const MAX_PAGES = 50
const MAX_CHARS = 120_000

export interface PdfText {
  text: string
  pageCount: number
  truncated: boolean
}

export async function extractPdfText(file: File | Blob): Promise<PdfText> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const data = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data }).promise
  const pageCount = pdf.numPages
  const pages = Math.min(pageCount, MAX_PAGES)

  const chunks: string[] = []
  let total = 0
  for (let n = 1; n <= pages; n++) {
    const page = await pdf.getPage(n)
    const content = await page.getTextContent()
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    chunks.push(text)
    total += text.length
    if (total >= MAX_CHARS) break
  }

  const text = chunks.join('\n').replace(/\s+\n/g, '\n').trim()
  return {
    text: text.slice(0, MAX_CHARS),
    pageCount,
    truncated: pageCount > MAX_PAGES || text.length >= MAX_CHARS,
  }
}
