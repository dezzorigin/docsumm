# DocSumm — Deployment (Cloudflare Pages)

## Ringkasan

DocSumm di-deploy sebagai **static export Next.js + Pages Worker**:

| Lapisan | Cara |
|---|---|
| Frontend | `npm run build` → `out/` (static export, `output: 'export'`) |
| API + auth guard + callback | `worker/_worker.js` → di-copy ke `out/_worker.js` saat build → di-deploy sebagai `_worker.bundle` |
| Deploy | Cloudflare Pages API langsung (`cf_pages.py`, pola yang sama dengan repo P1 sebelumnya) |
| Nama Pages | `docsumm` → `https://docsumm.pages.dev` |

## Kenapa bukan `next start` / Vercel

Dokumen arsitektur lama menyebut Vercel — itu rencana Sprint 1 yang tidak
pernah terjadi. Target deploy yang diputuskan di program P1 adalah
Cloudflare Pages. Karena `output: 'export'` tidak bisa membawa route
handler dinamis (`/api/*`, `/auth/callback`) dan middleware, semua logika
server pindah ke Pages Worker (`worker/_worker.js`). Lihat `docs/API.md`.

## Build lokal

```bash
npm ci
npm run build   # = copy-pdf-worker + next build + cp worker/_worker.js out/_worker.js
npm run serve   # sajikan out/ + worker di http://127.0.0.1:8331
```

`npm run build` melakukan 3 hal:

1. `copy-pdf-worker` — menyalin `node_modules/pdfjs-dist/build/pdf.worker.min.mjs`
   ke `public/pdf.worker.min.mjs` (dibutuhkan ekstraksi teks PDF di browser).
2. `next build` — static export ke `out/` (11 halaman).
3. `cp worker/_worker.js out/_worker.js` — worker ikut ter-deploy sebagai
   `_worker.bundle` (cf_pages.py menangani konversinya).

Cek hasil build:

```bash
curl -s http://127.0.0.1:8331/api/status
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8331/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8331/app/dashboard
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8331/app/result/00000000-0000-4000-8000-000000000001
```

## Deploy ke Pages

```bash
# Sekali saja: buat proyek (nama "docsumm" — namespace global!)
python3 ~/workspace/github-actions/cf_pages.py create-project docsumm

# Setiap rilis:
npm run build
python3 ~/workspace/github-actions/cf_pages.py deploy docsumm out
```

Catatan nama (pelajaran dari repo P1 sebelumnya): ketersediaan nama **tidak
bisa** dicek via GET project — 404 hanya berarti "bukan milik akun kita".
Nama adalah namespace global; baru ketahuan saat create/deploy. Bila
`docsumm` sudah dipakai akun lain (HTTP 409) atau bersufiks, fallback urut:
`doc-summ` → `ringkas-dokumen`.

## Environment (Pages dashboard → Settings → Variables)

| Nama | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `OPENROUTER_API_KEY` | **Secret** | Tidak | Tanpa ini worker memakai ringkasan ekstraktif. Jangan taruh di variable biasa. |
| `NEXT_PUBLIC_SUPABASE_URL` | Variable | Tidak | Tanpa ini aplikasi mode demo (tanpa akun). Contoh: `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Variable | Tidak | Anon key Supabase (bukan service_role!). |
| `NEXT_PUBLIC_APP_URL` | Variable | Tidak | URL publik, dipakai sebagai HTTP-Referer ke OpenRouter. Default: `https://docsumm.pages.dev` |

Setelah mengubah variable/secret: **re-deploy** (Pages tidak me-restart
worker otomatis untuk deploy yang sudah jalan).

## Mengaktifkan mode Supabase

1. Buat proyek di [Supabase](https://supabase.com) (free tier cukup).
2. Jalankan `supabase/schema.sql` di SQL Editor (tabel + RLS + trigger
   profil + policy Storage). Buat bucket `documents` (privat) di Storage.
3. Di Supabase → Authentication → URL Configuration: Site URL =
   `https://docsumm.pages.dev`, Redirect URL tambahkan
   `https://docsumm.pages.dev/auth/callback`.
4. Isi 2 variable di Pages (tabel di atas), re-deploy.
5. Verifikasi: buka `/auth/register` → daftar → dashboard menampilkan
   email; `/api/status` → `"mode": "supabase"`.

## Mengaktifkan ringkasan AI penuh

1. Buat kunci di [OpenRouter](https://openrouter.ai/keys) (model yang
   dipakai: `google/gemini-flash-1.5` + `google/gemini-2.0-flash-exp`).
2. Pasang sebagai **Secret** `OPENROUTER_API_KEY` di Pages, re-deploy.
3. Verifikasi: `GET /api/status` → `"ai": true, "engine": "ai"`;
   unggah PDF → halaman hasil **tidak** menampilkan banner
   "Ringkasan otomatis (tanpa AI)".

## Jebakan yang sudah diperbaiki (baca sebelum mengubah deploy)

1. **`generateStaticParams` harus menghasilkan ≥ 1 rute.** Next 16
   menganggap `generateStaticParams()` yang mengembalikan `[]` sama dengan
   tidak ada → build error `Page "/app/result/[id]" is missing
   "generateStaticParams()"`. Solusi: prerender id dokumen contoh
   (`app/app/result/[id]/page.tsx`) + worker fallback shell untuk id lain.
2. **`useParams()` mengembalikan id contoh.** Shell prerender membawa
   payload RSC dengan `params.id` contoh. Solusi: id dibaca dari
   `window.location.pathname` (`components/result/ResultView.tsx`).
3. **Halaman diekspor sebagai `<rute>.html`.** URL `/app/dashboard`
   tidak cocok dengan file `out/app/dashboard.html` secara exact-match.
   Worker mencoba `<path>.html` secara eksplisit (jangan bergantung pada
   pemetaan default Pages).
4. **Middleware tidak bisa ikut static export** (`middleware.ts` dihapus;
   guard pindah ke worker + `components/layout/AuthGuard.tsx`).
   Di Next 16, konvensi `middleware` juga sudah deprecated (diganti `proxy`).
5. **Route group `(app)` bukan prefix URL.** Dulu halaman ada di
   `app/(app)/...` sehingga URL aslinya `/dashboard` — padahal semua link
   menunjuk `/app/dashboard` (404). Folder dipindah jadi `app/app/...`
   (segmen nyata).
6. **Build crash tanpa env Supabase.** `createClient()` dulu memakai `!`
   sehingga prerender dashboard crash. Sekarang mengembalikan `null` dan
   aplikasi beralih ke mode demo.
7. **Token desain `globals.css`.** Dulu hanya ada varian `--ds-*`, padahal
   komponen memakai `--accent`, `--bg-2`, `--text-2`, dll. — tombol tampil
   tanpa warna. Sekarang token pendek didefinisikan (alias `--ds-*`
   dipertahankan).
