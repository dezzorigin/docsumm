# DocSumm — Keamanan

## Ringkasan

- **Tidak ada secret yang ter-commit.** Audit riwayat: tidak ada `.env`,
  kunci API, atau kredensial Supabase di tree maupun riwayat git.
- **Kunci hanya lewat environment.** `.env.example` berisi placeholder saja.
- **RLS di semua tabel.** User hanya bisa CRUD baris miliknya sendiri.
- **Storage privat per-user.** Bucket `documents` tidak publik.
- **Kunci OpenRouter hanya sebagai secret Pages** (bukan variable), dan
  hanya dibaca worker di sisi server — tidak pernah dikirim ke browser.

## Secret & environment

| Secret | Di mana | Aturan |
|---|---|---|
| `OPENROUTER_API_KEY` | Secret Pages (dashboard/API) | Jangan taruh di variable biasa; jangan commit; jangan tempel di chat |
| `NEXT_PUBLIC_SUPABASE_URL` | Variable Pages / `.env.local` | Boleh terekspos (URL publik proyek) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Variable Pages / `.env.local` | Anon key by design aman di klien (RLS yang menjaga) — tapi tetap jangan commit |
| `SUPABASE_SERVICE_ROLE_KEY` | **Tidak dipakai** | Worker + klien tidak butuh service_role; jangan pernah menambahkannya ke repo/Pages |

`.gitignore` mengabaikan `.env*` kecuali `.env.example`. Jangan pernah
menjalankan `git add .env.local`.

## Autentikasi & otorisasi

- **Auth:** Supabase Auth (email/password). Sesi disimpan cookie
  `sb-<project-ref>-auth-token` oleh `@supabase/ssr` (format: JSON sesi
  di-encode base64url).
- **Guard ganda:** worker menolak `/app/*` tanpa cookie sesi (mode
  Supabase), dan `components/layout/AuthGuard.tsx` melakukan hal yang
  sama di klien. Keduanya tidak aktif di mode demo (by design — demo
  memang tanpa akun).
- **Callback:** `GET /auth/callback` menukar PKCE `code` lewat
  `POST {SUPABASE_URL}/auth/v1/token?grant_type=pkce` dengan header
  `apikey` (anon key). Kode yang salah → redirect login dengan
  `?error=callback_error`.
- **RLS:** lihat `supabase/schema.sql` — policy `auth.uid() = user_id`
  di `profiles` (read/update own), `templates` dan `documents`
  (all own rows). `contact_requests` hanya boleh insert.
- **Storage:** policy `storage.objects` membatasi ke folder
  `{user_id}/...` milik sendiri. Bucket `documents` privat; URL publik
  dari `getPublicUrl` hanya bekerja bila bucket/policy mengizinkan —
  untuk file privat, pakai signed URL (di luar cakupan v1.0; saat ini
  `file_url` disimpan tapi pratinjau file tidak ditampilkan).

## Worker

- Worker tidak me-log request body, kunci, atau isi dokumen.- Validasi input di `validateSummarizeBody()`: `text` maks 120.000
  karakter, gambar maks ~8 MB dan harus data URL `png/jpg/webp/tiff`,
  template harus punya field valid. Body bukan JSON → 400.
- Worker hanya memanggil 2 host luar: `openrouter.ai` (bila kunci ada)
  dan `{SUPABASE_URL}/auth/v1/token` (callback). Tidak ada fetch lain.
- Respons `cache-control: no-store` untuk semua endpoint API.
- **Catatan mode demo:** teks dokumen dikirim ke `/api/summarize`
  untuk dirangkum (tanpa kunci AI, pemrosesan 100% lokal di worker dan
  teks tidak diteruskan ke mana pun). Gambar untuk OCR diteruskan ke
  OpenRouter bila kunci ada — itu satu-satunya aliran data dokumen
  keluar dari Pages.

## Higiene dependensi (CI gate)

- Job `advisory-sweep` di CI memeriksa **hanya dependensi produksi**
  terhadap GitHub Advisory Database, dan FAIL bila ada temuan
  high/critical (`scripts/advisory-sweep.py` — pengganti `npm audit`,
  yang bocor ke dev deps).
- `shadcn` (CLI) **harus tetap di `devDependencies`**. Ia pernah duduk
  di `dependencies` dan menyeret seluruh pohonnya (MCP SDK, express,
  dotenvx, undici, ...) ke klasifikasi produksi — 57 temuan HIGH/CRITICAL
  di CI run pertama PR proper ini. Tidak ada kode runtime yang meng-import
  `shadcn`.
- Versi yang dipasang sudah melewati gate ini: Next.js 16.4.6, zod 4.6.7,
  postcss 8.5.23 (via Next), sharp 0.35.5, nanoid 3.3.20,
  source-map-js 1.2.2. Bila advisory baru muncul, naikkan versi
  (atau pindah paket ke dev bila memang hanya dipakai build-time) —
  jangan menonaktifkan gate.

## Yang belum / bukan jaminan

- **RLS + policy Storage di `supabase/schema.sql` belum diuji terhadap
  proyek Supabase live** (belum ada proyek Supabase untuk repo ini —
  deployment live berjalan mode demo). Sebelum go-live mode Supabase,
  uji: user A tidak bisa SELECT/UPDATE/DELETE dokumen user B, dan
  tidak bisa mengunduh file di folder user B.
- **Ekspor `.txt`** berisi ringkasan — pengguna bertanggung jawab atas
  file yang mereka unduh/bagikan.
- **Mode demo menyimpan data di localStorage** — siapa pun yang memakai
  browser yang sama bisa membaca dokumen demo. Jangan unggah dokumen
  sensitif di perangkat bersama.
