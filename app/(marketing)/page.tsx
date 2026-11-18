import Link from 'next/link'
import { SummaryCard } from '@/components/result/SummaryCard'
import { MetaChips } from '@/components/result/MetaChips'
import { TagList } from '@/components/result/TagList'
import { SAMPLE_DOCUMENT } from '@/lib/demo/sample'

const FEATURES = [
  {
    icon: '📄',
    title: 'PDF, foto & scan',
    desc: 'Unggah PDF, JPG, PNG, atau TIFF sampai 50 MB. Teks PDF dibaca langsung di browser; gambar dibaca lewat OCR.',
  },
  {
    icon: '🧠',
    title: 'Ringkasan terstruktur',
    desc: 'Bukan sekadar potongan teks: overview, poin kritis, action item, tanggal penting, dan metadata — dalam format JSON yang rapi.',
  },
  {
    icon: '📝',
    title: 'Template kustom',
    desc: 'Buat template ekstraksi sendiri — misal laporan inspeksi kapal — dan dapatkan hasil berbentuk tabel sesuai field yang kamu tentukan.',
  },
  {
    icon: '⚡',
    title: 'Langsung jalan, tanpa akun',
    desc: 'Mode demo: unggah PDF dan lihat ringkasannya tanpa daftar. Pasang Supabase kalau mau akun, riwayat, dan penyimpanan awan.',
  },
  {
    icon: '🔍',
    title: 'Riwayat & ekspor',
    desc: 'Semua dokumen tersimpan di dashboard. Buka lagi kapan pun, salin ringkasan, atau unduh sebagai teks.',
  },
  {
    icon: '🔒',
    title: 'Kunci API tetap milikmu',
    desc: 'Kunci OpenRouter (untuk AI) dan kredensial Supabase tidak pernah di-commit — semuanya lewat environment variable.',
  },
]

// Preview produk di hero: kartu ringkasan ASLI (komponen SummaryCard
// yang sama dengan halaman hasil), diisi data contoh dari lib/demo/sample.
function ProductPreview() {
  const s = SAMPLE_DOCUMENT.summary_json
  if (!s || s.mode !== 'card') return null
  return (
    <div
      className="text-left rounded-2xl border shadow-lg overflow-hidden"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)', boxShadow: '0 24px 60px -24px rgba(0,0,0,0.25)' }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">📄</span>
          <span className="text-sm font-medium truncate">{SAMPLE_DOCUMENT.title}</span>
        </div>
        <span
          className="px-2 py-1 rounded-full text-xs shrink-0"
          style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }}
        >
          ✓ done
        </span>
      </div>
      <div className="p-5 space-y-4">
        <MetaChips
          items={[
            { icon: '📋', label: s.metadata.document_type },
            { icon: '📍', label: s.metadata.location },
            { icon: '👥', label: s.metadata.parties.join(' · ') },
          ]}
        />
        <SummaryCard label="Overview" icon="📝">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{s.overview}</p>
        </SummaryCard>
        <SummaryCard label="Poin kritis" icon="⚠️" variant="warning">
          <ul className="text-sm space-y-1" style={{ color: 'var(--text-2)' }}>
            {s.critical_points.map((p, i) => (
              <li key={i}>• {p}</li>
            ))}
          </ul>
        </SummaryCard>
        <SummaryCard label="Action items" icon="✅" variant="success">
          <ul className="text-sm space-y-1" style={{ color: 'var(--text-2)' }}>
            {s.action_items.map((a, i) => (
              <li key={i}>• {a}</li>
            ))}
          </ul>
        </SummaryCard>
        <TagList tags={s.metadata.tags} />
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-[1080px] mx-auto px-6 pt-14 pb-10 md:pt-[72px]">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 rounded-full text-xs font-medium mb-6"
              style={{
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--accent)',
                padding: '3px 9px',
                height: '22px',
                borderRadius: '999px',
              }}
            >
              ✨ AI-powered document analysis
            </div>

            <h1
              className="mb-6"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 7vw, 50px)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                lineHeight: 1.12,
              }}
            >
              Any document.
              <br />
              Instant clarity.
            </h1>

            <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'var(--text-2)' }}>
              Upload any document—PDF, photo, or scan. Get structured summaries in seconds.
              No manual reading required. Tanpa daftar pun bisa dicoba.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/app/upload"
                className="text-white font-medium transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent)',
                  borderRadius: '10px',
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Ringkas dokumen — gratis
              </Link>
              <Link
                href="#features"
                className="font-medium transition-all border"
                style={{
                  borderColor: 'var(--border-2)',
                  color: 'var(--text-1)',
                  borderRadius: '10px',
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'transparent',
                }}
              >
                Lihat fitur
              </Link>
            </div>

            <p className="text-xs mt-4" style={{ color: 'var(--text-3)' }}>
              Mode demo tanpa akun · PDF dibaca di browser · OCR & AI bila kunci API terpasang
            </p>
          </div>

          <ProductPreview />
        </div>
      </section>

      {/* Stats Row */}
      <section className="max-w-[900px] mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { value: '8s', label: 'Average summary time' },
            { value: '97%', label: 'OCR accuracy' },
            { value: '40+', label: 'Document types supported' },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center border"
              style={{
                backgroundColor: 'var(--bg-2)',
                borderColor: 'var(--border)',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div
                className="text-3xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
              >
                {s.value}
              </div>
              <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-[1080px] mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Semua yang kamu butuh untuk membaca lebih sedikit
        </h2>
        <p className="text-center mb-12 max-w-[560px] mx-auto" style={{ color: 'var(--text-2)' }}>
          Dari unggahan sampai ringkasan terstruktur — satu alur, tanpa setup yang ribet.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-6 border"
              style={{ borderColor: 'var(--border)', borderRadius: '12px', backgroundColor: 'var(--bg-2)' }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-2 text-[16px]">{f.title}</h3>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-[900px] mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-display)' }}>
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: '1', title: 'Upload', desc: 'Drop your PDF, photo, or scanned document. We support 40+ file types.' },
            { n: '2', title: 'AI Analysis', desc: 'Our AI extracts text via OCR and generates a structured summary automatically.' },
            { n: '3', title: 'Get Results', desc: 'Review structured insights: overview, critical points, action items, and more.' },
          ].map((s) => (
            <div key={s.n} className="text-center p-6 border" style={{ borderColor: 'var(--border)', borderRadius: '10px' }}>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold"
                style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}
              >
                {s.n}
              </div>
              <h3 className="font-semibold mb-2 text-[16px]">{s.title}</h3>
              <p className="text-[13px]" style={{ color: 'var(--text-2)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates teaser */}
      <section id="templates" className="max-w-[900px] mx-auto px-6 py-16">
        <div
          className="p-8 md:p-10 rounded-2xl border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}
        >
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Butuh format ringkasan sendiri?
          </h2>
          <p className="text-[15px] mb-6 max-w-[560px]" style={{ color: 'var(--text-2)' }}>
            Buat template ekstraksi dengan field kamu sendiri — contoh: laporan inspeksi kapal
            dengan field jenis dokumen, poin kritis, dan tindakan. Hasilnya keluar sebagai tabel
            yang siap dipakai.
          </p>
          <Link
            href="/app/templates"
            className="inline-block px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Buka Template →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-[720px] mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: 'var(--font-display)' }}>
          FAQ
        </h2>
        <div className="space-y-6">
          {[
            {
              q: 'Apakah harus daftar dulu?',
              a: 'Tidak. Mode demo bisa langsung dipakai: unggah PDF, teks diekstrak di browser, dan ringkasan dibuat di tempat. Daftar (Supabase) hanya perlu kalau mau menyimpan riwayat di awan.',
            },
            {
              q: 'Bagaimana kalau tidak ada kunci AI?',
              a: 'Tetap jalan. Tanpa OPENROUTER_API_KEY, worker memakai ringkasan ekstraktif — kalimat-kalimat penting dari dokumen itu sendiri — dan halaman hasil menandainya dengan jelas sebagai "ringkasan otomatis (tanpa AI)".',
            },
            {
              q: 'Apakah dokumen saya diunggah ke server?',
              a: 'Di mode demo, tidak: file dibaca lokal di browser dan hanya teksnya yang dikirim ke /api/summarize untuk dirangkum. Di mode Supabase, file disimpan di Storage privat milikmu sendiri.',
            },
            {
              q: 'Format file apa yang didukung?',
              a: 'PDF, JPG, PNG, dan TIFF sampai 50 MB. PDF hasil scan (gambar) tetap bisa dirangkum lewat OCR bila kunci AI terpasang.',
            },
          ].map((item) => (
            <div key={item.q}>
              <h3 className="font-semibold mb-1">{item.q}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[900px] mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Berhenti membaca dokumen halaman demi halaman.
        </h2>
        <p className="mb-8" style={{ color: 'var(--text-2)' }}>
          Unggah dokumen pertamamu dan lihat ringkasannya dalam hitungan detik.
        </p>
        <Link
          href="/app/upload"
          className="inline-block px-8 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          Mulai sekarang — gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t mt-8 py-10" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-[1080px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>DocSumm</p>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              © 2026 DocSumm. Built with Next.js, Supabase, and AI.
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm" style={{ color: 'var(--text-2)' }}>
            <a href="#features" className="hover:opacity-70">Fitur</a>
            <a href="https://github.com/dezzorigin/docsumm" target="_blank" rel="noreferrer" className="hover:opacity-70">
              GitHub
            </a>
            <a
              href="https://github.com/dezzorigin/docsumm/blob/main/docs/ARCHITECTURE.md"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-70"
            >
              Dokumentasi
            </a>
            <a
              href="https://github.com/dezzorigin/docsumm/blob/main/LICENSE"
              target="_blank"
              rel="noreferrer"
              className="hover:opacity-70"
            >
              MIT License
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
