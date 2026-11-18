# DocSumm — Design System

---

## Catatan implementasi (proper v1.0)

- **Token pendek = sumber kebenaran.** `globals.css` dulu hanya
  mendefinisikan token `--ds-*` (mis. `--ds-bg`, `--ds-accent`), padahal
  semua komponen memakai token pendek (`--bg`, `--bg-2`, `--accent`,
  `--text-2`, `--border`, `--danger`, ...). Akibatnya tombol dan surface
  tampil tanpa warna (build lolos, render rusak). Sekarang token pendek
  didefinisikan di `:root` dan `[data-theme="dark"]`, dan `--ds-*`
  dipertahankan sebagai alias — jangan hapus alias sebelum semua referensi
  `--ds-*` di komponen dicek.
- **`.text-eyebrow`** ditambahkan (dipakai `SummaryCard`); token
  `--bg-card` yang disebut spek Card di atas tidak ada — pakai `var(--bg)`.
- **Landing content** kini `max-width: 1080px` (bukan 640px) karena hero
  dua kolom + preview produk.
- **Bottom tab bar** (mobile): Dashboard / Upload / **Templates** /
  Settings (bukan "Documents").

## Identity
- **Product name:** DocSumm
- **Tagline:** Any document. Instant clarity.
- **Tone:** Professional, clean, minimal. Enterprise-ready without feeling cold.
- **Reference vibes:** seefluencer.com, tradewithxander.com — glassmorphism, minimal text, modern.

---

## Color Tokens

### Light Mode (default)
```
--bg:           #FFFFFF      Page background
--bg-2:         #F7F7F8      Secondary surface (cards, inputs)
--bg-3:         #EFEFEF      Tertiary (hover, dividers)
--border:       #E8E8EA      Default border
--border-2:     #D4D4D8      Stronger border
--text-1:       #111111      Primary text
--text-2:       #666666      Secondary text
--text-3:       #A0A0A5      Muted/placeholder
--accent:       #1B7A47      Primary green (brand)
--accent-bg:    #EAF5EF      Accent surface
--accent-bd:    #B8DEC9      Accent border
--danger:       #C0392B      Error/critical
--danger-bg:    #FEF0EF      Danger surface
--warn:         #8A6200      Warning
--warn-bg:      #FEF8EC      Warning surface
```

### Dark Mode
```
--bg:           #101012
--bg-2:         #18181B
--bg-3:         #222226
--border:       #2C2C30
--border-2:     #3C3C42
--text-1:       #F0F0F2
--text-2:       #888892
--text-3:       #505058
--accent:       #2ECC71
--accent-bg:    #0C2218
--accent-bd:    #174D2E
--danger:       #E87070
--danger-bg:    #220E0E
--warn:         #F5C542
--warn-bg:      #1E1800
```

---

## Typography

```
Display:  Space Grotesk — 700 weight — headings, hero, logo
Body:     Inter — 400/500 — all body text, labels, UI
Mono:     JetBrains Mono — code snippets only (optional)
```

### Type Scale
```
hero:     clamp(30px, 7vw, 46px) / Space Grotesk 700
h1:       28px / Space Grotesk 700
h2:       20px / Space Grotesk 700
h3:       16px / Inter 600
body:     15px / Inter 400
small:    13px / Inter 400
micro:    11px / Inter 500 (labels, badges, eyebrows)
eyebrow:  10px / Inter 600 / uppercase / letter-spacing 0.08em
```

---

## Spacing & Radius

```
Radius:
  --r:      10px   (default cards, inputs, buttons)
  --r-lg:   16px   (large cards, dropzone)
  --r-xl:   22px   (modal, auth card)
  --r-pill: 999px  (badges, tags, pills)

Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64
```

---

## Component Specs

### Button
```
Primary:  bg accent, white text, r-10, pad 9px 18px, font 13px/500
Outline:  bg transparent, border border-2, text-1, same size
Ghost:    bg transparent, no border, text-2
Sizes:    sm (7px 14px), md (9px 18px), lg (11px 22px)
Full-width on mobile for primary CTA
```

### Card
```
bg: var(--bg-card)
border: 1px solid var(--border)
border-radius: var(--r)
No shadow by default — border does the separation
Hover state: border-color var(--border-2)
```

### Badge / Tag
```
Height: 22px
Padding: 3px 9px
Border-radius: pill
Font: 11px/500
Variants: green (done), yellow (processing), red (error), gray (muted)
```

### Input / Field
```
bg: var(--bg-2)
border: 1px solid var(--border)
border-radius: var(--r)
padding: 9px 13px
font-size: 14px
focus: border-color accent
placeholder: text-3
```

### Summary Block (Result page)
```
Card with padding 16px 18px
Left border 3px for semantic color (danger/success/warn)
Label: eyebrow style, colored per type
Content: 14px / 1.7 line-height
```

### Summary Table (Custom Template mode)
```
Full-width table
Header row: bg-2, eyebrow text
Data rows: alternating bg / bg-2 on hover
Border: 1px border between rows
Cell padding: 12px 14px
Mobile: stack to key-value pairs
```

---

## Layout

### App Shell
```
Desktop:
  [Sidebar 192px] | [Main content flex-1]
  Sidebar: sticky, full height, border-right

Mobile:
  No sidebar
  Bottom tab bar (Dashboard / Upload / Documents / Settings)
  OR: hamburger → slide-in drawer
  FAB (+) button for primary action (upload)
```

### Breakpoints
```
Mobile:   < 580px
Tablet:   580px – 900px
Desktop:  > 900px
```

### Page max-widths
```
Landing content:   640px centered
Upload form:       520px centered
Result page:       680px centered
Dashboard:         full width (within main)
```

---

## Animations
```
Screen transition:  fadeUp 220ms ease (opacity 0→1, translateY 8→0)
Progress bar:       width transition 250ms linear
Hover states:       all 150ms ease
Theme toggle:       background 200ms
Dropzone drag:      border-color + background 180ms
```

---

## Icons
Use Lucide React (already in shadcn/ui ecosystem).
Size: 16px inline, 20px standalone, 24px hero/decorative.
Stroke width: 1.5 (default Lucide).

---

## Mobile-specific
- Min tap target: 44x44px
- No hover-only interactions
- Inputs: font-size min 16px (prevents iOS zoom)
- Sticky nav height: 52px
- FAB: 50px circle, bottom-right, z-200
- Bottom safe area: padding-bottom env(safe-area-inset-bottom)
