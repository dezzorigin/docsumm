# PRD — DocSumm

## 1. Informasi Proyek

| Field | Nilai |
|---|---|
| Nama Proyek | DocSumm |
| Tagline | Any document. Instant clarity. |
| Tech Stack | Next.js 16 (App Router, static export) + Cloudflare Pages + Pages Worker + Supabase + OpenRouter |
| Status | Proper v1.0 — live di Cloudflare Pages (mode demo tanpa akun; mode Supabase opsional) |
| Penanggung Jawab | Nabil Aulia Dika (dezzorigin) |
| Versi Dokumen | 2.0 |
| Tanggal | 18 November 2026 |

## 2. Latar Belakang

Membaca dokumen panjang — laporan inspeksi, kontrak, notulen, surat — memakan
waktu dan sering kali yang dibutuhkan hanya intinya: apa yang penting, apa
yang harus dilakukan, dan tanggal berapa batasnya. DocSumm mengubah dokumen
(PDF, foto, atau hasil scan) menjadi ringkasan terstruktur yang bisa langsung
dipakai: overview, poin kritis, action item, tanggal penting, dan metadata
(jenis dokumen, pihak terlibat, lokasi, tag).

Produk ini dibangun sebagai SaaS general-purpose yang bisa diadaptasi ke
vertikal spesifik (maritim, legal, medis, dsb.) lewat template ekstraksi
kustom — "Build Your Own Summary Model".

## 3. Masalah yang Diselesaikan

1. **Dokumen panjang, waktu sedikit** — pengguna harus membaca 10+ halaman
   untuk menemukan 3 keputusan penting.
2. **Hasil baca tidak terstruktur** — catatan manual berbeda-beda formatnya
   dan sulit dibagikan.
3. **Setiap jenis dokumen butuh format berbeda** — laporan inspeksi kapal
   butuh field yang berbeda dari kontrak atau notulen rapat.
4. **Setup akun menghambat coba-coba** — pengguna harus bisa mencoba produk
   sebelum mendaftar.

## 4. Tujuan & Sasaran

- Pengguna mengunggah PDF dan melihat ringkasan terstruktur dalam hitungan detik.
- Ringkasan selalu berbentuk JSON terstruktur (mode kartu atau mode tabel),
  bukan teks bebas.
- Template kustom bisa dibuat, disimpan, dan dipilih saat upload.
- Produk jalan penuh **tanpa akun** (mode demo); akun Supabase bersifat
  opsional untuk riwayat & penyimpanan awan.
- Tanpa kunci AI pun produk tetap berguna (ringkasan ekstraktif), dan
  status mesinnya ditampilkan jujur di UI.

## 5. Ruang Lingkup

### In Scope
- Landing page SaaS (navbar + hero + preview produk + fitur + cara kerja + FAQ + footer).
- Upload PDF (teks diekstrak di browser via pdfjs-dist) dan gambar (OCR via worker).
- Ringkasan terstruktur: mode kartu (default) dan mode tabel (template kustom).
- Dashboard (statistik + daftar dokumen), halaman hasil (bagi / ekspor / hapus),
  halaman template (CRUD), halaman settings.
- Mode demo (localStorage, tanpa akun) + mode Supabase (Auth + Postgres + Storage + RLS).
- Worker Cloudflare Pages: `POST /api/summarize`, `GET /api/status`,
  `GET /auth/callback`, guard auth, fallback shell halaman hasil.
- Dokumentasi lengkap (PRD → arsitektur → komponen → API → deployment → demo → keamanan).

### Out of Scope
- Pembayaran / paket berbayar (field `plan` ada di skema, belum dipakai).
- OCR gambar tanpa kunci AI (butuh OpenRouter — dijelaskan jujur di UI).
- Aplikasi mobile native; kolaborasi multi-user; ekspor PDF berformat
  (ekspor saat ini: file `.txt`).
- Backend di luar Pages Worker (tidak ada server Node terpisah).

## 6. Fitur & Persyaratan Fungsional

| # | Fitur | Perilaku |
|---|---|---|
| F1 | Upload dokumen | Dropzone (drag-drop / browse). Format: PDF, JPG, PNG, TIFF; maks 50 MB. Validasi tipe + ukuran di klien. |
| F2 | Ekstraksi teks PDF | Di browser (pdfjs-dist, maks 50 halaman / 120 ribu karakter). Tidak butuh kunci apa pun. |
| F3 | OCR gambar | Via `POST /api/summarize` + `imageBase64`; butuh `OPENROUTER_API_KEY`. Tanpa kunci → error 400 `OCR_KEY_REQUIRED` + penjelasan. |
| F4 | Ringkasan mode kartu | `overview` (2 kalimat), `critical_points`, `action_items`, `key_dates`, `metadata` (jenis dokumen, pihak, lokasi, tag). |
| F5 | Template kustom | Buat template (nama, deskripsi, mode output, field-field dengan key/label/deskripsi/wajib). Pilih template saat upload → hasil mode tabel. Jadikan default / hapus. |
| F6 | Dashboard | Statistik nyata (total, bulan ini, selesai, rata-rata halaman) + tabel dokumen (nama, tanggal, status) + empty state. |
| F7 | Halaman hasil | Header dokumen, MetaChips, kartu ringkasan / tabel, tag, banner mesin ("tanpa AI" bila ekstraktif), Share (salin link), Export (.txt), hapus dokumen. |
| F8 | Mode demo | Tanpa env Supabase: dokumen + template di localStorage; satu dokumen contoh + satu template contoh ter-seed otomatis. |
| F9 | Mode Supabase | Bila env terpasang: Auth email/password, tabel `documents`/`templates` (RLS per-user), Storage bucket `documents` privat, callback PKCE via worker. |
| F10 | Settings | Status deployment (mode + mesin ringkasan + `/api/status`), akun, tema, hapus data demo. |
| F11 | Tema gelap/terang | Toggle di navbar + settings; tersimpan di localStorage. |
| F12 | Landing | Navbar (logo + link GitHub repo), hero + preview produk ASLI (komponen ringkasan + data contoh), fitur, cara kerja, teaser template, FAQ, footer. |

### Kriteria penerimaan per fitur
- F1–F4: unggah PDF contoh (`docs/demo/test-inspeksi.pdf`) → redirect ke
  `/app/result/<id>` → ringkasan memuat "MV Nusantara", "korosi", dan
  "14 Juli 2024" (diuji headless, lihat `docs/screenshots/06-result-uploaded.png`).
- F5: buat template → pilih saat upload → hasil mode tabel dengan baris
  per field (diuji via `POST /api/summarize` di CI smoke test).
- F8: buka dashboard di browser bersih → dokumen contoh langsung tampil.
- F9: skema di `supabase/schema.sql` bisa dieksekusi; RLS mencegah user A
  membaca dokumen user B (lihat `docs/SECURITY.md`).

## 7. Persyaratan Non-Fungsional

- **Performa:** landing + dashboard render < 2 dtk di koneksi normal;
  ringkasan ekstraktif < 1 dtk (tanpa network AI); build statis di-serve CDN Pages.
- **Keamanan:** tidak ada secret yang ter-commit (`.env*` di-ignore kecuali
  `.env.example`); kunci OpenRouter hanya sebagai secret Pages; RLS di semua
  tabel; file Storage privat per-user.
- **Kejujuran mode:** bila tanpa kunci AI, UI menulis "Ringkasan otomatis
  (tanpa AI)" — tidak pernah mengklaim hasil ekstraktif sebagai hasil AI.
- **Maintainability:** TypeScript strict, ESLint bersih, worker punya unit
  test (`npm test`), CI hijau (build + typecheck + lint + worker-test +
  advisory-sweep + smoke + docs).
- **Portabilitas:** jalan di Linux/macOS/Windows; deploy cukup `npm run build`
  + upload `out/` (lihat `docs/DEPLOYMENT.md`).

## 8. Arsitektur & Tech Stack

Lihat `docs/ARCHITECTURE.md` dan `docs/DIAGRAMS.html`.

- **Frontend:** Next.js 16 App Router, `output: 'export'` (statis), React 19,
  TypeScript strict, Tailwind CSS v4, shadcn/ui, Zustand, pdfjs-dist.
- **API/server:** Cloudflare Pages Worker (`worker/_worker.js`) — satu file,
  tanpa dependensi: `/api/summarize`, `/api/status`, `/auth/callback`, guard
  auth, fallback shell halaman hasil.
- **AI:** OpenRouter — OCR `google/gemini-2.0-flash-exp`, ringkasan
  `google/gemini-flash-1.5`. Tanpa kunci → ringkasan ekstraktif lokal.
- **Data:** Supabase (Auth + Postgres + Storage) bila env terpasang;
  localStorage bila mode demo.
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`); deploy Cloudflare
  Pages via API (`~/workspace/github-actions/cf_pages.py`).

## 9. Milestone / Roadmap

| Fase | Status |
|---|---|
| Sprint 1 — Foundation | ✅ (Next.js + design system + komponen dasar) |
| Sprint 2 — Auth + Shell | ✅ (login/register, AppShell, guard via worker + klien) |
| Sprint 3 — Upload + OCR + Summarize | ✅ (dulu placeholder 501 — kini jalan penuh, AI + ekstraktif) |
| Proper v1.0 (18 Nov 2026) | ✅ (rebuild total: routing, token, demo mode, worker, CI, docs, deploy) |
| Berikutnya | Paket berbayar (field `plan` sudah ada) · ekspor PDF berformat · template marketplace · riwayat versi ringkasan |

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Kunci OpenRouter bocor | Hanya sebagai secret Pages (bukan variable); tidak pernah di-commit; `.env.example` hanya berisi placeholder |
| Kredensial Supabase ter-commit | `.gitignore` mengabaikan `.env*`; audit manual tiap PR (tidak ada secret di riwayat) |
| OCR/Ringkasan AI gagal (kuota/model mati) | Fallback otomatis ke ringkasan ekstraktif + `ai_error` di respons; upload tidak gagal |
| Halaman hasil id baru 404 di static export | Worker menyajikan shell dokumen contoh sebagai fallback (lihat `docs/DEPLOYMENT.md`) |
| `useParams()` mengembalikan id contoh | Id dibaca dari `window.location.pathname` (lihat `components/result/ResultView.tsx`) |
| PDF hasil scan tanpa lapisan teks | Pesan error jelas ("coba unggah sebagai gambar") — OCR gambar butuh kunci AI |
| pdfjs memotong baris `Tj` sangat panjang pada PDF sintetis | Fixture memakai baris ≤ 75 karakter; PDF asli (Word/printer) memakai banyak run pendek sehingga tidak terdampak |

## 11. Kriteria Keberhasilan

- `npm run build` + `npm run typecheck` + `npm run lint` + `npm test` hijau.
- CI hijau 6/6 job (build, worker-test, advisory-sweep, smoke, docs).
- Live di Cloudflare Pages: landing 200, `/api/status` mode demo,
  `POST /api/summarize` mengembalikan ringkasan valid.
- Play-test headless end-to-end lolos: unggah PDF → ringkasan → halaman hasil.
- README berisi screenshot ASLI + video demo; docs lengkap PRD → semua layer.

## 12. Lampiran

- Arsitektur: `docs/ARCHITECTURE.md`, diagram: `docs/DIAGRAMS.html`
- API worker: `docs/API.md`
- Deployment: `docs/DEPLOYMENT.md`
- Mode demo: `docs/DEMO.md`
- Keamanan: `docs/SECURITY.md`
- Skema DB: `docs/SCHEMA.md` + `supabase/schema.sql`
- Lisensi: MIT (`LICENSE`)
