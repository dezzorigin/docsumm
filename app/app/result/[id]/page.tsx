import { ResultView } from '@/components/result/ResultView'
import { SAMPLE_DOCUMENT } from '@/lib/demo/sample'

// Server wrapper: static export butuh generateStaticParams di file
// server — halaman dirender di klien oleh <ResultView /> (useParams).
//
// Next 16 hanya menganggap generateStaticParams "ada" bila ia
// menghasilkan MINIMAL SATU rute (array kosong = dianggap tidak ada),
// jadi prerender satu halaman: dokumen contoh mode demo. Untuk id lain,
// worker/_worker.js menyajikan file HTML ini sebagai fallback shell
// (komponen klien lalu memuat dokumen yang benar dari localStorage /
// Supabase berdasarkan id di URL) — lihat docs/DEPLOYMENT.md.
export function generateStaticParams() {
  return [{ id: SAMPLE_DOCUMENT.id }]
}

export default function ResultPage() {
  return <ResultView />
}
