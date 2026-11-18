# DocSumm — Reusable Components

## Naming Convention
- PascalCase for component files
- All components in /components/{category}/
- shadcn/ui base components in /components/ui/ (don't modify)

---

## Layout Components

### `<Logo />`
Props: size ('sm' | 'md' | 'lg'), showText (boolean)
Usage: Sidebar, TopNav, MobileNav, MarketingNav, auth pages.
SVG mark: dokumen + centang (dibuat ulang di proper v1.0).

### `<MarketingNav />`
Navbar landing: logo, link Fitur / Cara kerja / Template / FAQ,
ikon GitHub → https://github.com/dezzorigin/docsumm, Sign In,
tombol "Coba gratis".

### `<Sidebar />`
- Desktop only (hidden < 580px)
- Items: Dashboard, Upload, Templates, Settings (+ badge "Demo" bila mode demo)
- "Keluar ke beranda" di bawah; logout (mode Supabase) / kembali ke landing (mode demo)
- Null-safe: tidak crash bila Supabase belum terkonfigurasi

### `<TopNav />`
- Mobile: logo + hamburger + theme toggle
- Desktop: logo + theme toggle
- Sticky, height 52px

### `<MobileNav />`
- Bottom tab bar (mobile only)
- 4 items: Dashboard, Upload, Templates, Settings
- Active state with accent color

### `<AuthGuard />`
- Client guard untuk `app/app/layout.tsx`: mode Supabase tanpa sesi →
  redirect `/auth/login`; mode demo selalu lolos.
- Pasangan dari guard worker (lihat `docs/API.md`).

### `<ThemeToggle />`
- Icon button: sun/moon
- Toggles data-theme on `<html>`
- Persists to localStorage

> `components/layout/AppShell.tsx` masih ada tapi **tidak dipakai** —
> layout `app/app/layout.tsx` menyusun Sidebar + TopNav + MobileNav
> secara inline. Jangan membangun di atas AppShell.

---

## Upload Components

### `<Dropzone />`
Props:
- onFileSelect: (file: File) => void
- accept: string[] (default: pdf, jpg, png, tiff)
- maxSize: number (default: 50MB)
State: idle | dragging | selected
Shows: icon, label, browse button, file type hint

### `<UploadOptions />`
Props: onSelect: (type: 'camera' | 'scanner') => void
Two cards: Camera, Scanner. Mobile-first layout (grid 2 cols).
**Belum dipakai halaman mana pun** (fitur lanjutan).

### `<ProgressCard />`
Props:
- filename: string
- progress: number (0–100)
- step: string (current step label)
Shows animated progress bar + step text

---

## Result Components

### `<ResultView />`
Client component di balik `/app/result/[id]`. Membaca id dokumen dari
`window.location.pathname` (bukan `useParams()` — payload RSC shell
prerender membawa id contoh; lihat `docs/DEPLOYMENT.md`).
Menampilkan: ResultHeader, MetaChips, TagList, SummaryCard /
SummaryTable, banner mesin ekstraktif, ActionBar (Share / Export .txt /
hapus dokumen).

### `<SummaryCard />`
Props:
- label: string
- icon: ReactNode (sejak proper v1.0: benar-benar di-render)
- variant: 'default' | 'danger' | 'success' | 'warning'
- children: ReactNode
Renders one semantic block with colored left border + eyebrow label

### `<SummaryTable />`
Props:
- rows: { key: string, label: string, value: string }[]
Full-width table, mobile-responsive (stacks to key-value)

### `<MetaChips />`
Props: items: { icon: string, label: string }[]
Renders horizontal scrollable chip list

### `<TagList />`
Props: tags: string[]
Renders pill tags, wrapping

### `<ActionBar />`
Props:
- onShare: () => void
- onExport: () => void
- onNew: () => void
Three outline buttons: Share, Export (file .txt), New document

### `<ResultHeader />`
Props:
- filename: string
- pageCount: number
- processedIn: number (seconds)
- date: string
Card with file icon + metadata

---

## Template Components (Build Your Own Summary Model)

### Builder (di halaman, bukan komponen terpisah)
Template builder tinggal **inline di `app/app/templates/page.tsx`**
(nama, deskripsi, mode output, daftar FieldRow, preview, simpan).
`components/template/TemplateBuilder.tsx` yang lama adalah stub
placeholder dan **dihapus** di proper v1.0 — jangan dicari lagi.

### `<FieldRow />`
Props:
- field: { key, label, description, required }
- onUpdate: (field) => void
- onRemove: () => void
One row in the template builder — label input, description input, required toggle

### `<TemplatePreview />`
Props: fields: TemplateField[], mode: 'card' | 'table'
Live preview of what the output will look like with dummy data

### `<TemplatePicker />`
Props: templates: Template[], selectedId?: string | null, onSelect: (id) => void
Shown on Upload page — let user pick a template before processing.
Opsi "Ringkasan standar" (tanpa template) selalu tersedia; template
yang ditandai default terpilih otomatis.

---

## Dashboard Components

### `<StatGrid />`
Props: stats: { label: string, value: string | number }[]
Renders 3-col responsive stat cards. Dashboard memakai statistik
**nyata** (total, bulan ini, selesai, rata-rata halaman), bukan angka
hardcode.

### `<DocTable />`
Props:
- documents: Document[]
- onRowClick: (id: string) => void
Responsive table (3-col desktop, 2-col mobile)
Columns: Name, Date (hidden mobile), Status badge

### `<EmptyState />`
Props: title: string, description: string, action?: ReactNode
Centered empty state with icon

---

## Shared / Utility Components

### `<LoadingSpinner />`
Props: size ('sm' | 'md' | 'lg'), label?: string

### `<ContactCTA />` / `<ContactModal />`
Card + form "Mau custom model summary sendiri?" (permintaan Bang Imam).
Form: name, email, company, message → `contact_requests` table.
**Belum dipakai halaman mana pun** (fitur lanjutan; result page tidak
menampilkannya di v1.0).

---

## TypeScript Types (lib/types/index.ts)

```typescript
export type DocumentStatus = 'processing' | 'done' | 'error'
export type OutputMode = 'card' | 'table'
export type Plan = 'free' | 'pro'

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  plan: Plan
  created_at: string
}

export interface TemplateField {
  key: string
  label: string
  description: string
  required: boolean
}

export interface Template {
  id: string
  user_id: string
  name: string
  description?: string
  fields: TemplateField[]
  output_mode: OutputMode
  is_default: boolean
  created_at: string
}

export interface SummaryCardOutput {
  mode: 'card'
  overview: string
  critical_points: string[]
  action_items: string[]
  key_dates: { label: string; value: string }[]
  metadata: {
    document_type: string
    parties: string[]
    location: string
    tags: string[]
  }
}

export interface SummaryTableOutput {
  mode: 'table'
  template_id: string
  rows: { key: string; label: string; value: string }[]
}

export type SummaryOutput = SummaryCardOutput | SummaryTableOutput

export interface Document {
  id: string
  user_id: string
  title: string
  file_url: string
  file_type: 'pdf' | 'image'
  page_count?: number
  status: DocumentStatus
  raw_text?: string
  summary_json?: SummaryOutput
  template_id?: string
  output_mode: OutputMode
  created_at: string
  updated_at: string
}
```
