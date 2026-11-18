# DocSumm — Build Planner

> **Status aktual (proper v1.0, 18 Nov 2026):** Sprint 1–7 selesai (dengan
> penyesuaian di bawah), Sprint 8 diganti deploy Cloudflare Pages. Lihat
> bagian "Proper v1.0" di bawah untuk pekerjaan rebuild. Phase 2 belum
> dimulai.

## Phase 1 — MVP (Target: 2–3 weeks solo)

### Sprint 1 — Foundation (Days 1–3)
- [x] Init Next.js project (TypeScript + Tailwind + App Router) — Next.js 16.2.9 (bukan 14)
- [x] Install & configure shadcn/ui
- [x] Setup Supabase project (skema siap di `supabase/schema.sql`; proyek live belum dibuat — deployment berjalan mode demo)
- [x] Setup OpenRouter account + get API key (dipakai worker bila secret dipasang; tanpa itu mesin ekstraktif)
- [ ] Setup Vercel project — **DIBATALKAN**: target deploy Cloudflare Pages
- [x] Configure .env.local variables (tanpa `SUPABASE_SERVICE_ROLE_KEY` — tidak dipakai)
- [x] Create global CSS with design tokens (DESIGN.md) — token diperbaiki di proper v1.0 (lihat catatan di DESIGN.md)
- [x] Build base components: Logo, ThemeToggle, LoadingSpinner

---

### Sprint 2 — Auth + Shell (Days 4–5)
- [x] Auth pages: Login, Register
- [x] Supabase auth integration (client + server) — client + worker callback
- [x] Middleware: protect /app/* routes — **dipindah**: guard di worker + AuthGuard (middleware tidak bisa ikut static export; lihat docs/DEPLOYMENT.md)
- [x] Profile auto-create on register (trigger di `supabase/schema.sql`)
- [x] AppShell: Sidebar + TopNav + MobileNav (disusun inline di layout; `AppShell.tsx` tidak dipakai)
- [x] Route: /app/dashboard (empty state first) — kini statistik nyata + seed demo

---

### Sprint 3 — Upload + OCR + Summarize (Days 6–9)
CORE FEATURE — highest priority

- [x] Upload page UI: Dropzone + UploadOptions + ProgressCard
- [x] File upload to Supabase Storage (mode Supabase; mode demo tidak mengunggah file — teks diekstrak di browser)
- [x] API route: POST /api/summarize — **dipindah ke worker** (dulu placeholder 501; kini jalan penuh: AI + ekstraktif)
  - [x] Receive file from storage (mode Supabase) / text dari klien (mode demo)
  - [x] if image: call Gemini Vision via OpenRouter (OCR)
  - [x] if PDF: extract text via pdfjs-dist di browser (bukan pdf-parse — dihapus, tidak terpakai)
  - [x] Build default summary prompt
  - [x] Call summarize model via OpenRouter
  - [x] Parse JSON response (retry sekali bila gagal; fallback ekstraktif)
  - [x] Save to documents table (summary_json) / localStorage
- [x] Handle errors + status updates (processing → done/error)
- [x] Redirect to /app/result/[id] after done

---

### Sprint 4 — Result Page (Days 10–12)
- [x] Result page: fetch document by ID
- [x] ResultHeader component
- [x] MetaChips + TagList
- [x] ActionBar (Share, Export, New) — Export berupa file .txt (bukan PDF)
- [x] SummaryCard blocks (Overview, Critical, Actions, Dates)
- [x] SummaryTable component (for table output mode)
- [ ] Export to PDF (window.print() or html2pdf) — **belum**; ekspor .txt saja (lihat PRD §5)
- [x] Share link (copy URL to clipboard)

---

### Sprint 5 — Dashboard (Days 13–14)
- [x] StatGrid (total docs, this month, avg pages)
- [x] DocTable (list all user documents)
- [x] Status badges
- [x] Click row → go to result
- [x] Empty state (first-time user)
- [x] Delete document

---

### Sprint 6 — Custom Template / Build Your Own Summary Model (Days 15–18)
Bang Imam's key feature request.

- [x] Templates list page (/app/templates)
- [x] TemplateBuilder component — builder inline di page (stub `TemplateBuilder.tsx` dihapus)
  - [x] Name input
  - [x] Add/remove/reorder fields (FieldRow)
  - [x] Output mode toggle (card / table)
  - [x] Live preview (TemplatePreview)
  - [x] Save to templates table
- [x] TemplatePicker on Upload page
- [x] API route: build prompt from custom template fields — di worker (`/api/summarize` + `template`)
- [x] Render SummaryTable when output_mode = 'table'
- [ ] ContactCTA section on result page — **belum dipakai** (komponen siap)
- [ ] ContactModal (form → contact_requests table) — **belum dipakai**

---

### Sprint 7 — Landing Page + Polish (Days 19–21)
- [x] Landing page (marketing)
  - [x] Hero section
  - [x] Stats
  - [x] How it works (3 steps)
  - [x] Feature highlights
  - [x] CTA sections
- [x] SEO meta tags + OG image (meta dasar di `app/layout.tsx`; OG image belum dibuat)
- [x] Favicon + logo finalized (logo SVG baru di proper v1.0)
- [x] Mobile QA (test on real device) — play-test headless + screenshot desktop/mobile
- [x] Dark mode QA (screenshot dark mode di `docs/screenshots/10-landing-dark.png`)
- [ ] Error boundaries — **belum**
- [ ] Toast notifications (upload success, copy link, etc) — **belum** (status inline)
- [x] Loading states everywhere

---

### Sprint 8 — Deploy + Launch (Day 22)
- [x] Final deploy — **Cloudflare Pages** (bukan Vercel): `https://docsumm.pages.dev`
- [x] Set environment variables in Pages (mode demo: tanpa env; AI + Supabase opsional)
- [ ] Supabase production config — **belum** (proyek Supabase belum dibuat)
- [ ] Custom domain (if ready) — **belum**
- [x] Smoke test all flows end-to-end on mobile + desktop — play-test headless + CI smoke
- [ ] Share to bang Imam for review — **belum**

---

## Proper v1.0 — Rebuild (18 Nov 2026)

Pekerjaan rebuild di luar sprint di atas (program P1 repo #22):

- [x] Perbaiki routing: `app/(app)` → `app/app` (segmen URL nyata)
- [x] Perbaiki token desain `globals.css` (token pendek = sumber kebenaran)
- [x] Perbaiki `createClient()` nullable — build tidak crash tanpa env
- [x] Hapus `middleware.ts` + `app/api/*` + `app/auth/callback/route.ts`; logika pindah ke worker
- [x] Worker `_worker.js` + 16 unit test (API, guard, callback, fallback)
- [x] Mode demo (localStorage + seed dokumen/template contoh)
- [x] Mesin ringkasan ekstraktif (fallback AI)
- [x] Landing SaaS lengkap + preview produk asli
- [x] Halaman result/templates/settings/login/register jadi nyata (bukan placeholder)
- [x] README top-standard + screenshot asli + video demo
- [x] Docs lengkap PRD → semua layer + diagram HTML+SVG
- [x] CI 5 job (build, worker-test, advisory-sweep, smoke, docs)
- [x] Deploy live Cloudflare Pages + About repo homepage
- [ ] RLS + Storage policy diuji terhadap proyek Supabase live — **menunggu proyek Supabase**
- [ ] Play-test live di browser beneran — **menunggu parent agent** (subagent tidak punya live browser)

---

## Phase 2 — Post-MVP (After client feedback)
- [ ] Maritime domain mode (domain-specific prompt templates)
- [ ] Batch upload (multiple documents at once)
- [ ] Team/workspace support (multiple users)
- [ ] API access (for enterprise integration)
- [ ] Webhook notifications
- [ ] Usage analytics dashboard
- [ ] Billing integration (Stripe or Midtrans for IDR)
- [ ] White-label mode (for maritime company)

---

## Environment Variables Needed

```env
# Supabase (opsional — tanpa ini aplikasi mode demo)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY TIDAK dipakai — jangan tambahkan

# OpenRouter (opsional — tanpa ini ringkasan ekstraktif)
OPENROUTER_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Contact (optional)
CONTACT_EMAIL=hello@docsumm.io
```

---

## AI Model Config (OpenRouter)

```typescript
// OCR (image → text)
model: "google/gemini-2.0-flash-exp"
task: vision — extract all text from document image

// Summarize (text → structured JSON)
model: "google/gemini-flash-1.5"  // fast + cheap
  OR
model: "mistralai/mistral-small"   // alternative

// Response format: always JSON
// Max tokens: 2000 for summary
// Temperature: 0.2 (consistent, factual output)
```

---

## Prompt Strategy

### Default Summary Prompt
```
You are a professional document analyst.
Extract and summarize the following document.

Return a valid JSON object with this exact structure:
{
  "mode": "card",
  "overview": "2-3 sentence summary of the document",
  "critical_points": ["point 1", "point 2"],
  "action_items": ["action 1", "action 2"],
  "key_dates": [{"label": "date label", "value": "date value"}],
  "metadata": {
    "document_type": "type of document",
    "parties": ["party 1", "party 2"],
    "location": "location if mentioned",
    "tags": ["tag1", "tag2", "tag3"]
  }
}

Document text:
{DOCUMENT_TEXT}
```

### Custom Template Prompt
```
You are a professional document analyst.
Extract the following specific information from the document.

Return a valid JSON object with this exact structure:
{
  "mode": "table",
  "template_id": "{TEMPLATE_ID}",
  "rows": [
    {FIELDS_AS_ROWS}
  ]
}

Fields to extract:
{FIELDS_LIST}

Document text:
{DOCUMENT_TEXT}
```

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| OCR quality bad on low-res photos | Add image quality warning + suggestion to retake |
| AI returns invalid JSON | Wrap in try/catch, retry once, fallback to raw text |
| Large PDF (100+ pages) timeout | Chunk text, summarize in parts, merge |
| OpenRouter rate limit | Add retry with backoff |
| Supabase storage size | Set 50MB limit on client side before upload |
