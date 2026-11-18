# DocSumm — Arsitektur

## Stack (aktual, proper v1.0)

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16.4.6 (App Router), React 19.2.4, TypeScript (strict) |
| Render | Static export (`output: 'export'`) — 11 halaman ke `out/` |
| Styling | Tailwind CSS v4 (`@import "tailwindcss"` di `app/globals.css`), shadcn/ui |
| State | Zustand (`store/useAppStore.ts`), React hooks |
| PDF di browser | pdfjs-dist 6.5.438 (dynamic import, worker `/pdf.worker.min.mjs`) |
| Data (opsional) | Supabase — Auth + Postgres + Storage (`@supabase/ssr`) |
| Server | Cloudflare Pages Worker (`worker/_worker.js`, tanpa dependensi) |
| AI (opsional) | OpenRouter — `google/gemini-flash-1.5` (ringkas), `google/gemini-2.0-flash-exp` (OCR) |
| Deploy | Cloudflare Pages — `https://docsumm.pages.dev` |
| CI | GitHub Actions — build, worker-test, advisory-sweep, smoke, docs |

> Catatan sejarah: dokumen ini dulu menyebut Next.js 14 dan deploy Vercel —
> itu rencana Sprint 1 yang tidak pernah terjadi. Target deploy yang
> diputuskan adalah Cloudflare Pages; stack di atas adalah yang terpasang
> dan terverifikasi di `package.json`.

## Struktur folder

```
docsumm/
├── app/
│   ├── (marketing)/          # landing page (navbar + hero + fitur + FAQ + footer)
│   ├── app/                  # aplikasi — segmen URL NYATA /app/*
│   │   ├── dashboard/        # statistik + tabel dokumen
│   │   ├── upload/           # dropzone + TemplatePicker
│   │   ├── result/[id]/      # wrapper server (prerender sample id) → ResultView
│   │   ├── templates/        # CRUD template (builder inline di page)
│   │   ├── settings/         # status deployment, akun, tema, hapus data demo
│   │   └── layout.tsx        # AuthGuard + Sidebar + TopNav + MobileNav
│   ├── auth/login/           # login (mode demo: tombol "tanpa akun")
│   ├── auth/register/        # register (hanya bila Supabase terpasang)
│   └── globals.css           # token desain (lihat docs/DESIGN.md)
├── components/
│   ├── layout/               # Logo, Sidebar, TopNav, MobileNav, AuthGuard, ThemeToggle
│   ├── result/               # SummaryCard, SummaryTable, MetaChips, TagList, ResultView
│   ├── template/             # FieldRow, TemplatePreview, TemplatePicker
│   ├── upload/               # Dropzone, UploadOptions*, ProgressCard
│   ├── dashboard/            # StatGrid, DocTable, EmptyState
│   └── shared/               # LoadingSpinner, ContactCTA*, ContactModal*, ActionBar
├── hooks/                    # useDocuments, useTemplates, useUpload (dual-mode)
├── lib/
│   ├── config.ts             # isSupabaseConfigured() — satu sumber kebenaran mode
│   ├── demo/                 # store.ts, sample.ts, extractPdfText.ts (mode demo)
│   ├── supabase/             # client.ts (nullable), server.ts (server-only, tidak dipakai deploy)
│   ├── openrouter/           # prompts AI (dipakai worker — logic sama)
│   └── types/index.ts        # Document, Template, SummaryOutput, ...
├── worker/
│   ├── _worker.js            # Pages Worker: /api/*, /auth/callback, guard, fallback
│   └── _worker.test.mjs      # 16 unit test (node --test)
├── scripts/                  # copy-pdf-worker.mjs, serve-worker.mjs, advisory-sweep.py
├── supabase/schema.sql       # tabel + RLS + trigger + policy Storage
├── docs/                     # dokumentasi (indeks: docs/README.md)
└── .github/workflows/ci.yml  # 5 job
```

\* `UploadOptions`, `ContactCTA`, `ContactModal` adalah komponen yang
sudah jadi tapi **belum dipakai halaman mana pun** (fitur lanjutan).

## Dua mode operasi

Dipilih otomatis oleh `lib/config.ts`:

```
NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY terpasang?
  YA  → mode Supabase (Auth + Postgres + Storage)
  TIDAK → mode demo (localStorage, tanpa akun)
```

| | Mode demo | Mode Supabase |
|---|---|---|
| Dokumen | `localStorage` (`docsumm.demo.documents.v1`) | tabel `documents` + Storage bucket `documents` |
| Template | `localStorage` (`docsumm.demo.templates.v1`) | tabel `templates` |
| Auth | tidak ada | Supabase Auth (email/password) |
| Seed | 1 dokumen + 1 template contoh | tidak ada |
| Ringkasan | sama — worker `/api/summarize` | sama |

Hook `useDocuments` / `useTemplates` / `useUpload` adalah dual-mode:
mereka memanggil `lib/demo/store.ts` di mode demo, dan Supabase client
di mode Supabase. Lihat `docs/DEMO.md`.

## Alur data

```
Upload PDF
  └─> extractPdfText() [browser, pdfjs-dist] ──> teks
Upload gambar
  └─> imageBase64 ─────────────────────────────> worker /api/summarize
teks ──> POST /api/summarize { text, title, template? }
  ├─ OPENROUTER_API_KEY ada? ──> AI (Gemini) ──> JSON terstruktur
  └─ tidak ada / AI gagal ────> ekstraktif lokal ──> JSON terstruktur
        └─> simpan (localStorage / Supabase) ──> redirect /app/result/<id>
```

Ringkasan selalu berbentuk JSON terstruktur (`SummaryCardOutput` mode
kartu, atau `SummaryTableOutput` mode tabel bila template dikirim) — lihat
`lib/types/index.ts` dan `docs/API.md`.

## Alur auth (mode Supabase)

```
Register/Login (Supabase Auth)
  └─> email konfirmasi / callback
      └─> GET /auth/callback?code=... (WORKER, bukan route handler)
          └─> tukar code → sesi (POST {SUPABASE_URL}/auth/v1/token?grant_type=pkce)
              └─> set cookie sb-<ref>-auth-token (format @supabase/ssr)
                  └─> redirect /app/dashboard
Guard: worker menolak /app/* tanpa cookie · AuthGuard klien menolak hal yang sama
```

## Routing — 3 perbaikan penting (proper v1.0)

1. **Route group `(app)` bukan prefix URL.** Dulu halaman ada di
   `app/(app)/...` sehingga URL aslinya `/dashboard`, padahal semua link
   menunjuk `/app/dashboard` (404) dan middleware menjaga `/app/*` yang
   tidak ada. Folder dipindah jadi `app/app/...` (segmen nyata).
2. **Static export + dynamic id.** Halaman hasil `/app/result/[id]`
   memakai `generateStaticParams()` yang mem-prerender id dokumen contoh
   (satu-satunya rute yang bisa di-prerender). Worker menyajikan shell
   itu untuk id lain (fallback). `ResultView` membaca id dari
   `window.location.pathname` — karena payload RSC shell membawa
   `params.id` contoh, `useParams()` akan mengembalikan id yang salah.
3. **Middleware dihapus.** `middleware.ts` tidak bisa ikut static export
   (dan di Next 16 sudah deprecated, diganti `proxy`). Guard pindah ke
   worker + `AuthGuard` klien. Cookie yang dulu dicek middleware
   (`sb-access-token`) juga tidak pernah cocok dengan nama cookie asli
   `@supabase/ssr` (`sb-<ref>-auth-token`).

## Design system

Lihat `docs/DESIGN.md`. Catatan implementasi: `globals.css` dulu hanya
mendefinisikan token `--ds-*`, padahal semua komponen memakai token
pendek (`--accent`, `--bg-2`, `--text-2`, ...). Sekarang token pendek
adalah sumber kebenaran dan `--ds-*` dipertahankan sebagai alias.

## Batas yang diketahui

- Teks ke `/api/summarize` maks 120.000 karakter; gambar maks ~8 MB.
- Ekstraksi PDF di browser maks 50 halaman (batas klien, `extractPdfText.ts`).
- Ekspor hasil saat ini `.txt` (bukan PDF berformat).
- `lib/supabase/server.ts` adalah server-only (memakai `next/headers`) —
  **tidak dipakai** deployment Pages; dipertahankan sebagai referensi
  bila suatu hari ada server Node lagi.
- `lib/openrouter/*` dipakai worker sebagai referensi prompt; pemanggilan
  API sebenarnya ada di `worker/_worker.js` (tidak bisa meng-import lib
  Next dari worker).
