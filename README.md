# Docsumm

Docsumm — project oleh Nabil Aulia Dika (dezzorigin).

## Status Proyek

**Hampir selesai (beta)** _(README ada, build artifact ada)_

## 📋 Tech Stack

Next.js

## 🏗️ Arsitektur

```mermaid
flowchart LR
  U[Pengguna] --> B[Browser]
  B --> F[Frontend (React/Next.js)]
  F --> A[API Routes]
  A --> D[(Database)]
```

## 📁 Struktur Proyek

```
app/
components/
docs/
hooks/
lib/
public/
store/
AGENTS.md
CLAUDE.md
LICENSE
PRD.md
README.md
components.json
eslint.config.mjs
middleware.ts
next-env.d.ts
next.config.ts
package.json
postcss.config.mjs
tsconfig.json
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```

> Untuk project HTML/Python/Go, lihat instruksi di atas atau file konfigurasi.

## 📄 Lisensi

MIT — lihat [LICENSE](./LICENSE).

---
_Dikembangkan oleh **dezzorigin** (Nabil Aulia Dika)._
