'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResultHeader } from '@/components/result/ResultHeader'
import { SummaryCard } from '@/components/result/SummaryCard'
import { SummaryTable } from '@/components/result/SummaryTable'
import { MetaChips } from '@/components/result/MetaChips'
import { TagList } from '@/components/result/TagList'
import { ActionBar } from '@/components/result/ActionBar'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatSummary } from '@/lib/utils/formatSummary'
import { isSupabaseConfigured } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { getDemoDocument, deleteDemoDocument } from '@/lib/demo/store'
import type { Document } from '@/lib/types'

export function ResultView() {
  const params = useParams()
  const router = useRouter()
  // JANGAN pakai useParams() mentah-mentah: static export hanya punya
  // SATU halaman hasil prerender (dokumen contoh) dan worker menyajikan
  // shell itu untuk semua id lain — payload RSC-nya membawa params.id
  // CONTOH, sehingga useParams() mengembalikan id contoh walau URL-nya
  // id lain. window.location.pathname selalu URL asli.
  const id =
    typeof window !== 'undefined'
      ? window.location.pathname.split('/').filter(Boolean).pop() || ''
      : String(params.id || '')
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [engine, setEngine] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (!isSupabaseConfigured()) {
        setDoc(getDemoDocument(id))
      } else {
        const supabase = createClient()
        if (supabase) {
          const { data } = await supabase.from('documents').select('*').eq('id', id).single()
          setDoc((data as Document) || null)
        }
      }
      setLoading(false)
    }
    load()
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setEngine(d.engine || null))
      .catch(() => {})
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent mx-auto mb-4"
            style={{ color: 'var(--accent)' }}
          />
          <p style={{ color: 'var(--text-2)' }}>Loading result...</p>
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="p-6 max-w-[720px] mx-auto">
        <EmptyState
          title="Document not found"
          description="Dokumen ini tidak ada — mungkin sudah dihapus, atau kamu membuka link dari mode demo yang berbeda."
          action={
            <button
              onClick={() => router.push('/app/dashboard')}
              className="px-6 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Back to Dashboard
            </button>
          }
        />
      </div>
    )
  }

  const summary = doc.summary_json
  const date = new Date(doc.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard tidak tersedia — abaikan */
    }
  }

  const handleExport = () => {
    if (!summary) return
    const text =
      summary.mode === 'card'
        ? formatSummary(summary)
        : summary.rows.map((r) => `${r.label}: ${r.value}`).join('\n')
    const blob = new Blob([`${doc.title}\n${'='.repeat(doc.title.length)}\n\n${text}\n`], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title.replace(/\.[^.]+$/, '')}-summary.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Hapus "${doc.title}"?`)) return
    if (!isSupabaseConfigured()) {
      deleteDemoDocument(doc.id)
    } else {
      const supabase = createClient()
      if (supabase) await supabase.from('documents').delete().eq('id', doc.id)
    }
    router.push('/app/dashboard')
  }

  return (
    <div className="p-6 max-w-[720px] mx-auto space-y-6">
      <ResultHeader
        filename={doc.title}
        pageCount={doc.page_count}
        date={date}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ActionBar onShare={handleShare} onExport={handleExport} onNew={() => router.push('/app/upload')} />
        <button onClick={handleDelete} className="text-sm" style={{ color: 'var(--danger)' }}>
          Delete document
        </button>
      </div>
      {copied && (
        <p className="text-sm" style={{ color: 'var(--accent)' }}>
          Link hasil disalin ke clipboard.
        </p>
      )}

      {doc.status === 'processing' && (
        <div
          className="p-4 rounded-lg border text-sm"
          style={{ borderColor: 'var(--warn-bg)', backgroundColor: 'var(--warn-bg)', color: 'var(--text-2)' }}
        >
          Dokumen masih diproses. Muat ulang halaman ini sebentar lagi.
        </div>
      )}

      {doc.status === 'error' && (
        <div
          className="p-4 rounded-lg border text-sm"
          style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}
        >
          Pemrosesan dokumen ini gagal. Coba unggah ulang dari halaman Upload.
        </div>
      )}

      {engine === 'extractive' && summary && (
        <div
          className="p-4 rounded-lg border text-sm"
          style={{ borderColor: 'var(--accent-bd)', backgroundColor: 'var(--accent-bg)', color: 'var(--text-2)' }}
        >
          <strong style={{ color: 'var(--text-1)' }}>Ringkasan otomatis (tanpa AI).</strong>{' '}
          Kunci AI (OPENROUTER_API_KEY) belum terpasang di deployment ini, jadi ringkasan di bawah
          disusun langsung dari kalimat-kalimat dokumen. Pasang kuncinya untuk ringkasan AI penuh.
        </div>
      )}

      {!summary && doc.status === 'done' && (
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Dokumen selesai diproses tapi tidak ada ringkasan tersimpan.
        </p>
      )}

      {summary && summary.mode === 'card' && (
        <>
          <MetaChips
            items={[
              { icon: '📋', label: summary.metadata.document_type || 'Dokumen' },
              ...(summary.metadata.location
                ? [{ icon: '📍', label: summary.metadata.location }]
                : []),
              ...(summary.metadata.parties.length > 0
                ? [{ icon: '👥', label: summary.metadata.parties.join(' · ') }]
                : []),
            ]}
          />
          <SummaryCard label="Overview" icon="📝">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              {summary.overview}
            </p>
          </SummaryCard>
          {summary.critical_points.length > 0 && (
            <SummaryCard label="Poin kritis" icon="⚠️" variant="warning">
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-2)' }}>
                {summary.critical_points.map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            </SummaryCard>
          )}
          {summary.action_items.length > 0 && (
            <SummaryCard label="Action items" icon="✅" variant="success">
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-2)' }}>
                {summary.action_items.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </SummaryCard>
          )}
          {summary.key_dates.length > 0 && (
            <SummaryCard label="Tanggal penting" icon="📅">
              <ul className="text-sm space-y-1" style={{ color: 'var(--text-2)' }}>
                {summary.key_dates.map((d, i) => (
                  <li key={i}>
                    <strong>{d.label}:</strong> {d.value}
                  </li>
                ))}
              </ul>
            </SummaryCard>
          )}
          {summary.metadata.tags.length > 0 && <TagList tags={summary.metadata.tags} />}
        </>
      )}

      {summary && summary.mode === 'table' && (
        <SummaryTable rows={summary.rows} />
      )}
    </div>
  )
}
