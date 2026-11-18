# DocSumm — API Worker

Semua endpoint dinamis tinggal di Cloudflare Pages Worker
(`worker/_worker.js`) karena aplikasi Next.js adalah static export
(`output: 'export'`) dan tidak bisa membawa route handler. Worker ini
satu file JavaScript tanpa dependensi, dan punya unit test
(`worker/_worker.test.mjs`, `npm test`).

Base URL lokal: `http://127.0.0.1:8331` (`npm run serve`).
Base URL live: `https://docsumm.pages.dev` (lihat `docs/DEPLOYMENT.md`).

## GET /api/status

Health check + mode deployment. Dipakai halaman Settings dan smoke test CI.

```bash
curl https://docsumm.pages.dev/api/status
```

Respons 200:

```json
{
  "ok": true,
  "service": "docsumm",
  "mode": "demo",
  "ai": false,
  "engine": "extractive",
  "supabase_configured": false
}
```

| Field | Arti |
|---|---|
| `mode` | `demo` (tanpa Supabase) atau `supabase` |
| `ai` | `true` bila secret `OPENROUTER_API_KEY` terpasang di Pages |
| `engine` | `ai` atau `extractive` — mesin yang dipakai `/api/summarize` |
| `supabase_configured` | `true` bila `NEXT_PUBLIC_SUPABASE_URL` terpasang |

## POST /api/summarize

Membuat ringkasan terstruktur dari teks atau gambar. Inilah endpoint yang
dulu hanya placeholder 501 — sekarang benar-benar jalan.

```bash
curl -X POST https://docsumm.pages.dev/api/summarize \
  -H 'content-type: application/json' \
  -d '{"text": "Laporan inspeksi ... 14 Juli 2024.", "title": "Laporan Inspeksi Kapal.pdf"}'
```

### Request body

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `text` | string | salah satu dari `text` / `imageBase64` | Teks dokumen (maks 120.000 karakter) |
| `imageBase64` | string | salah satu | Data URL gambar (`data:image/png;base64,...`, maks ~8 MB) |
| `title` | string | tidak | Nama file — dipakai menebak jenis dokumen |
| `template` | object | tidak | `{ id, fields: [{ key, label, description, required }] }` — bila ada, hasil mode tabel |

### Respons sukses (200)

```json
{
  "summary": {
    "mode": "card",
    "overview": "...",
    "critical_points": ["..."],
    "action_items": ["..."],
    "key_dates": [{ "label": "Batas waktu", "value": "14 Juli 2024" }],
    "metadata": {
      "document_type": "Inspection Report",
      "parties": ["PT Maju Teknik"],
      "location": "Pelabuhan Belawan",
      "tags": ["korosi", "inspeksi"]
    }
  },
  "engine": "extractive",
  "source": "text"
}
```

| Field | Arti |
|---|---|
| `summary` | `SummaryCardOutput` (mode kartu) atau `SummaryTableOutput` (mode tabel, bila `template` dikirim) — lihat `lib/types/index.ts` |
| `engine` | `ai` (OpenRouter) atau `extractive` (lokal, tanpa kunci) |
| `source` | `text` atau `ocr` |
| `ai_error` | (opsional) pesan error AI saat fallback ke ekstraktif |

### Mesin ringkasan

1. **AI** (bila `OPENROUTER_API_KEY` terpasang): OCR gambar via
   `google/gemini-2.0-flash-exp`, ringkasan via `google/gemini-flash-1.5`
   dengan prompt yang sama seperti `lib/openrouter/summarize.ts`
   (sekali coba + sekali retry bila JSON tidak bisa di-parse).
2. **Ekstraktif** (tanpa kunci): deterministik, tanpa network —
   overview = 2 kalimat pertama; poin kritis = kalimat ber-kata-kunci
   (penting/kritis/wajib/risiko/denda/korosi/...); action item = kalimat
   ber-kata-kerja (perbaiki/jadwalkan/hubungi/...); tanggal = regex
   tanggal Indonesia/ISO; pihak = pola `PT/CV/...`; lokasi = pola
   `Pelabuhan/Kota/...`; tag = kata terering (stopword disaring).
   Untuk mode tabel, tiap field diisi kalimat dengan skor kecocokan
   kata tertinggi, atau `"Tidak ditemukan di dokumen"`.

Bila AI gagal (kuota/model mati), worker **fallback otomatis** ke
ekstraktif dan tetap mengembalikan 200 + `ai_error` — upload tidak gagal.

### Error

| Status | Body | Arti |
|---|---|---|
| 400 | `{ "error": "Kirim \`text\` atau \`imageBase64\`." }` | Body kosong / tidak valid |
| 400 | `{ "error": "Teks terlalu panjang ...", }` | `text` > 120.000 karakter |
| 400 | `{ "error": "imageBase64 harus data URL gambar ...", }` | Gambar bukan data URL / terlalu besar |
| 400 | `{ "error": "OCR gambar butuh kunci AI ...", "code": "OCR_KEY_REQUIRED" }` | OCR tanpa `OPENROUTER_API_KEY` — unggah PDF saja |
| 405 | `{ "error": "Method harus POST." }` | Method selain POST |
| 422 | `{ "error": "Tidak ada teks yang terbaca dari gambar ini." }` | OCR mengembalikan teks kosong |
| 500 | `{ "error": "Gagal membuat ringkasan. Coba lagi." }` | Error tak terduga |

## GET /auth/callback

Pengganti `app/auth/callback/route.ts` (tidak bisa ikut static export).
Menukar PKCE `code` dari Supabase menjadi sesi:

```
GET /auth/callback?code=<code>&next=/app/dashboard
```

- Tanpa `code` / tanpa Supabase → redirect `/auth/login?error=callback_error`.
- Sukses → set cookie `sb-<project-ref>-auth-token` (format yang sama
  dengan `@supabase/ssr`: JSON sesi di-encode base64url) lalu redirect ke
  `next` (default `/app/dashboard`).

## Guard auth (di worker)

Pengganti `middleware.ts`:

- Mode Supabase + request `/app/*` tanpa cookie sesi → redirect `/auth/login`.
- Mode Supabase + request `/auth/*` dengan cookie sesi → redirect `/app/dashboard`.
- Mode demo: semua rute `/app/*` terbuka (tanpa akun).

## Routing aset statis (di worker)

- Request aset → `env.ASSETS.fetch(request)`.
- Bila 404 dan path tanpa ekstensi → coba `<path>.html` (Next mengekspor
  halaman sebagai `<rute>.html`, URL-nya tanpa ekstensi).
- Bila tetap 404 dan path cocok `/app/result/<id>` → sajikan
  `/app/result/00000000-0000-4000-8000-000000000001.html` (shell dokumen
  contoh; komponen klien memuat dokumen yang benar dari id di URL).
  Tanpa ini, refresh/deep link ke hasil dokumen baru akan 404.
- Selain itu → 404.

## Batas & keamanan

- `text` maks 120.000 karakter; gambar maks ~8 MB; template harus punya
  minimal 1 field dengan `key` + `label` string.
- Worker tidak pernah me-log kunci; `OPENROUTER_API_KEY` hanya dibaca dari
  `env` (secret Pages). Lihat `docs/SECURITY.md`.
