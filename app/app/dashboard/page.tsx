'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatGrid } from '@/components/dashboard/StatGrid'
import { DocTable } from '@/components/dashboard/DocTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDocuments } from '@/hooks/useDocuments'
import { isSupabaseConfigured } from '@/lib/config'

export default function DashboardPage() {
  const { documents, loading } = useDocuments()
  const router = useRouter()

  const now = new Date()
  const thisMonth = documents.filter((d) => {
    const created = new Date(d.created_at)
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
  }).length
  const done = documents.filter((d) => d.status === 'done').length
  const withPages = documents.filter((d) => typeof d.page_count === 'number')
  const avgPages =
    withPages.length > 0
      ? Math.round(withPages.reduce((sum, d) => sum + (d.page_count || 0), 0) / withPages.length)
      : 0

  const stats = [
    { label: 'Total Documents', value: documents.length },
    { label: 'This Month', value: thisMonth },
    { label: 'Completed', value: done },
    { label: 'Avg Pages', value: avgPages },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent mx-auto mb-4"
               style={{ color: 'var(--accent)' }}
          />
          <p style={{ color: 'var(--text-2)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-2)' }}>
            Welcome back! Here&apos;s your document overview.
          </p>
        </div>

        <Link
          href="/app/upload"
          className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 inline-flex items-center gap-2"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <span>📤</span>
          <span>Upload</span>
        </Link>
      </div>

      {!isSupabaseConfigured() && (
        <div
          className="mb-8 p-4 rounded-lg border text-sm"
          style={{ borderColor: 'var(--accent-bd)', backgroundColor: 'var(--accent-bg)', color: 'var(--text-2)' }}
        >
          <strong style={{ color: 'var(--text-1)' }}>Mode demo aktif.</strong> Tanpa akun — dokumen
          disimpan di browser ini saja. Satu dokumen contoh sudah disiapkan supaya kamu bisa
          langsung menjelajah. Pasang Supabase (lihat <code>.env.example</code>) untuk akun &amp;
          penyimpanan awan.
        </div>
      )}

      {/* Stats */}
      <div className="mb-8">
        <StatGrid stats={stats} />
      </div>

      {/* Recent Documents */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Documents</h2>

        {documents.length === 0 ? (
          <EmptyState
            title="No documents yet"
            description="Upload your first document to get started with AI-powered summaries."
            action={
              <Link
                href="/app/upload"
                className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 inline-flex items-center gap-2"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <span>📤</span>
                <span>Upload Document</span>
              </Link>
            }
          />
        ) : (
          <DocTable
            documents={documents}
            onRowClick={(id) => router.push(`/app/result/${id}`)}
          />
        )}
      </div>

      {/* Quick Tips */}
      {documents.length === 0 && (
        <div className="mt-12 p-6 rounded-lg border" style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-2)'
        }}>
          <h3 className="font-semibold mb-3">💡 Quick Tips</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
            <li>• Upload PDFs, photos, or scanned documents</li>
            <li>• AI extracts text automatically via OCR</li>
            <li>• Get structured summaries in seconds</li>
            <li>• Create custom templates for specific document types</li>
          </ul>
        </div>
      )}
    </div>
  )
}
