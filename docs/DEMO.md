# DocSumm — Mode Demo (tanpa akun)

## Apa itu mode demo

Bila `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` **tidak**
terpasang (inilah kondisi deployment live saat ini), DocSumm berjalan dalam
**mode demo**: semua fitur bisa dipakai tanpa daftar dan tanpa akun.

| Aspek | Mode demo | Mode Supabase |
|---|---|---|
| Akun | Tidak ada — langsung pakai | Email/password (Supabase Auth) |
| Dokumen disimpan di | `localStorage` browser ini | Tabel `documents` + Storage |
| Template disimpan di | `localStorage` browser ini | Tabel `templates` |
| Ringkasan | Worker `/api/summarize` (AI bila kunci ada, ekstraktif bila tidak) | Sama |
| Riwayat | Hanya di browser ini (hilang bila cache dibersihkan) | Tersimpan di awan, semua perangkat |

Mode dipilih otomatis oleh `lib/config.ts` (`isSupabaseConfigured()`).
Halaman Dashboard, Settings, dan Login menampilkan banner "Mode demo aktif"
supaya tidak ada yang mengira datanya tersimpan di server.

## Data contoh (seed)

Saat pertama kali dibuka, mode demo mengisi localStorage dengan:

- **Satu dokumen contoh** — "Laporan Inspeksi Kapal — MV Nusantara.pdf"
  (4 halaman, status done) beserta ringkasan kartu lengkapnya. Data ini
  diambil dari contoh `summary_json` di `docs/SCHEMA.md` — bukan karangan.
- **Satu template contoh** — "Laporan Inspeksi Kapal" (field: Jenis
  Dokumen, Poin Kritis, Tindakan yang Diperlukan; mode tabel; default).

Seed terjadi di `lib/demo/store.ts` (`seedDemoIfEmpty()`) dan hanya bila
key localStorage belum ada — dokumen yang kamu unggah tidak pernah
ditimpa. Hapus data demo dari halaman Settings → Zona berbahaya
(`clearDemoData()`).

Key localStorage: `docsumm.demo.documents.v1`,
`docsumm.demo.templates.v1`.

## Alur upload di mode demo

```
Pilih file (Dropzone)
  → PDF: teks diekstrak DI BROWSER (pdfjs-dist, worker /pdf.worker.min.mjs)
    Gambar: dikirim ke worker untuk OCR (butuh OPENROUTER_API_KEY)
  → POST /api/summarize { text | imageBase64, title, template? }
    → AI (bila kunci ada) atau ekstraktif (bila tidak)
  → simpan dokumen + summary_json ke localStorage (status done)
  → redirect /app/result/<id>
```

File **tidak pernah diunggah ke server** di mode demo: PDF dibaca lokal,
dan hanya **teksnya** yang dikirim ke `/api/summarize` untuk dirangkum.
Gambar adalah pengecualian: OCR butuh server, jadi gambar dikirim ke
worker (dan worker meneruskannya ke OpenRouter bila kunci ada).

## Mesin ringkasan ekstraktif

Tanpa `OPENROUTER_API_KEY`, worker memakai ringkasan ekstraktif
(`worker/_worker.js` → `extractiveSummary()`). Cara kerjanya didokumentasi
di `docs/API.md`. Halaman hasil menampilkan banner:

> **Ringkasan otomatis (tanpa AI).** Kunci AI (OPENROUTER_API_KEY) belum
> terpasang di deployment ini, jadi ringkasan di bawah disusun langsung
> dari kalimat-kalimat dokumen.

Banner ini hilang begitu kunci AI dipasang (engine jadi `ai`).

## Keterbatasan yang diketahui

1. **OCR gambar butuh kunci AI.** Tanpa kunci, unggah gambar mengembalikan
   error 400 `OCR_KEY_REQUIRED` dengan penjelasan + saran mengunggah PDF.
2. **PDF hasil scan (gambar) tanpa lapisan teks** menghasilkan error yang
   jelas ("Tidak ada teks yang bisa dibaca ... coba unggah sebagai gambar").
3. **Data lokal.** Dokumen demo hilang bila localStorage dibersihkan atau
   ganti browser/perangkat. Itu by design — pasang Supabase untuk data
   permanen (lihat `docs/DEPLOYMENT.md`).
4. **PDF sintetis dengan baris `Tj` sangat panjang.** pdfjs-dist memotong
   baris literal `Tj` yang lebih panjang dari ~100 karakter pada PDF
   buatan tangan (ditemukan saat membuat fixture
   `docs/demo/test-inspeksi.pdf`). PDF asli dari Word/printer memakai
   banyak run pendek sehingga tidak terdampak; fixture memakai baris
   ≤ 75 karakter.
5. **Ekspor hasil** saat ini berupa file `.txt` (bukan PDF berformat) —
   lihat PRD §5 Out of Scope.

## File uji

- `docs/demo/test-inspeksi.pdf` — PDF 1 halaman berisi laporan inspeksi
  kapal (teks yang sama dengan dokumen contoh). Dipakai play-test
  headless: unggah → ringkasan harus memuat "MV Nusantara", "korosi",
  dan "14 Juli 2024".
- `docs/screenshots/` — 10 screenshot ASLI dari play-test headless.
- `docs/demo/demo.mp4` — video demo 12 detik (walkthrough: landing →
  dashboard → upload → hasil → template → settings → dark mode).
