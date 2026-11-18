// DocSumm — mode demo (tanpa Supabase).
// Penyimpanan lokal (localStorage) untuk dokumen + template saat
// NEXT_PUBLIC_SUPABASE_URL / ANON_KEY tidak terpasang. Bentuk datanya
// SAMA dengan tabel Supabase (lib/types) sehingga halaman Dashboard /
// Result / Templates tidak perlu tahu mode apa yang aktif — hook
// useDocuments / useTemplates yang memilih sumbernya. Lihat docs/DEMO.md.

import type { Document, Template } from '@/lib/types'
import { SAMPLE_DOCUMENT, SAMPLE_TEMPLATE } from './sample'

const DOCS_KEY = 'docsumm.demo.documents.v1'
const TEMPLATES_KEY = 'docsumm.demo.templates.v1'

function read<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

// --- Dokumen ---------------------------------------------------------------

export function listDemoDocuments(): Document[] {
  seedDemoIfEmpty()
  return read<Document>(DOCS_KEY).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )
}

export function getDemoDocument(id: string): Document | null {
  return listDemoDocuments().find((d) => d.id === id) ?? null
}

export function saveDemoDocument(doc: Document): void {
  const docs = read<Document>(DOCS_KEY).filter((d) => d.id !== doc.id)
  docs.unshift(doc)
  write(DOCS_KEY, docs)
}

export function updateDemoDocument(id: string, patch: Partial<Document>): Document | null {
  const docs = read<Document>(DOCS_KEY)
  const idx = docs.findIndex((d) => d.id === id)
  if (idx === -1) return null
  docs[idx] = { ...docs[idx], ...patch, updated_at: new Date().toISOString() }
  write(DOCS_KEY, docs)
  return docs[idx]
}

export function deleteDemoDocument(id: string): void {
  write(
    DOCS_KEY,
    read<Document>(DOCS_KEY).filter((d) => d.id !== id)
  )
}

// --- Template --------------------------------------------------------------

export function listDemoTemplates(): Template[] {
  seedDemoIfEmpty()
  return read<Template>(TEMPLATES_KEY).sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  )
}

export function saveDemoTemplate(tpl: Template): void {
  const tpls = read<Template>(TEMPLATES_KEY).filter((t) => t.id !== tpl.id)
  tpls.unshift(tpl)
  write(TEMPLATES_KEY, tpls)
}

export function deleteDemoTemplate(id: string): void {
  write(
    TEMPLATES_KEY,
    read<Template>(TEMPLATES_KEY).filter((t) => t.id !== id)
  )
}

// --- Seed ------------------------------------------------------------------
// Satu dokumen contoh + satu template contoh, supaya dashboard dan halaman
// hasil bisa langsung dijelajahi tanpa mengunggah apa pun. Data contoh
// diambil dari docs/SCHEMA.md (laporan inspeksi kapal) — bukan karangan.

export function seedDemoIfEmpty(): void {
  if (typeof window === 'undefined') return
  if (!window.localStorage.getItem(DOCS_KEY)) {
    write(DOCS_KEY, [SAMPLE_DOCUMENT])
  }
  if (!window.localStorage.getItem(TEMPLATES_KEY)) {
    write(TEMPLATES_KEY, [SAMPLE_TEMPLATE])
  }
}

export function clearDemoData(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DOCS_KEY)
  window.localStorage.removeItem(TEMPLATES_KEY)
}
