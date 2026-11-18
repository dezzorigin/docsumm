# DocSumm — Dokumentasi

Indeks dokumentasi lengkap. Mulai dari sini bila baru mengenal repo ini.

| Dokumen | Isi |
|---|---|
| [`../PRD.md`](../PRD.md) | PRD v2.0 — masalah, tujuan, fitur (F1–F12), kriteria penerimaan, risiko |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Arsitektur + tech stack + struktur folder + alur data & auth |
| [`DIAGRAMS.html`](DIAGRAMS.html) | 3 diagram SVG (arsitektur, alur upload, pipeline ringkasan) — buka di browser |
| [`COMPONENTS.md`](COMPONENTS.md) | Katalog komponen + props |
| [`DESIGN.md`](DESIGN.md) | Design system + token warna (termasuk perbaikan token `--ds-*`) |
| [`SCHEMA.md`](SCHEMA.md) | Skema database Supabase + Storage + contoh `summary_json` |
| [`API.md`](API.md) | Endpoint worker: `/api/status`, `/api/summarize`, `/auth/callback`, guard |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Build, deploy Pages, env var, aktivasi Supabase & AI, 7 jebakan yang diperbaiki |
| [`DEMO.md`](DEMO.md) | Mode demo (tanpa akun): seed, alur upload, mesin ekstraktif, keterbatasan |
| [`SECURITY.md`](SECURITY.md) | Secret, RLS, guard, aliran data, yang belum dijamin |
| [`PLANNER.md`](PLANNER.md) | Rencana sprint (Sprint 1–3 selesai; status proper v1.0) |
| [`CLINE_PROMPT.md`](CLINE_PROMPT.md) | Prompt asli pembuatan proyek (arsip — bukan dokumentasi aktif) |

Lainnya:

- [`../supabase/schema.sql`](../supabase/schema.sql) — SQL siap eksekusi (cerminan `SCHEMA.md`).
- [`../.env.example`](../.env.example) — contoh env (placeholder saja).
- [`../README.md`](../README.md) — pengantar + cara jalan + screenshot + video demo.
- [`screenshots/`](screenshots/) — 10 screenshot ASLI dari play-test headless.
- [`demo/demo.mp4`](demo/demo.mp4) — video demo 12 detik.
- [`demo/test-inspeksi.pdf`](demo/test-inspeksi.pdf) — PDF fixture play-test.
