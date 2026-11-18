'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { useDocuments } from '@/hooks/useDocuments'
import { isSupabaseConfigured } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { clearDemoData } from '@/lib/demo/store'

interface ApiStatus {
  ok: boolean
  mode: 'demo' | 'supabase'
  ai: boolean
  engine: 'ai' | 'extractive'
}

export default function SettingsPage() {
  const router = useRouter()
  const { documents } = useDocuments()
  const [status, setStatus] = useState<ApiStatus | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [cleared, setCleared] = useState(false)

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch(() => {})
    if (isSupabaseConfigured()) {
      const supabase = createClient()
      supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleClearDemo = () => {
    if (!window.confirm('Hapus semua dokumen & template demo di browser ini?')) return
    clearDemoData()
    setCleared(true)
    setTimeout(() => router.push('/app/dashboard'), 600)
  }

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
      <span className="text-sm font-medium shrink-0">{label}</span>
      <span className="text-sm text-right" style={{ color: 'var(--text-2)' }}>{value}</span>
    </div>
  )

  return (
    <div className="p-6 max-w-[720px] mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
        <p style={{ color: 'var(--text-2)' }}>Mode deployment, akun, dan data lokal.</p>
      </div>

      <section className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}>
        <h2 className="font-semibold mb-2">Deployment</h2>
        {row('Mode', status ? (status.mode === 'demo' ? 'Demo (tanpa Supabase)' : 'Supabase (akun aktif)') : '…')}
        {row(
          'Mesin ringkasan',
          status
            ? status.engine === 'ai'
              ? 'AI — OpenRouter (Gemini Flash)'
              : 'Ekstraktif — tanpa kunci AI'
            : '…'
        )}
        {row('Dokumen tersimpan', String(documents.length))}
        {row(
          'API',
          <a href="/api/status" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
            /api/status
          </a>
        )}
        {!isSupabaseConfigured() && (
          <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--text-3)' }}>
            Untuk mengaktifkan akun &amp; penyimpanan awan: buat proyek Supabase, jalankan
            supabase/schema.sql, lalu isi NEXT_PUBLIC_SUPABASE_URL dan
            NEXT_PUBLIC_SUPABASE_ANON_KEY (lihat .env.example dan docs/DEPLOYMENT.md).
            Untuk ringkasan AI penuh, pasang secret OPENROUTER_API_KEY di Pages.
          </p>
        )}
      </section>

      <section className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}>
        <h2 className="font-semibold mb-2">Akun</h2>
        {isSupabaseConfigured() ? (
          <>
            {row('Email', email || '…')}
            {row('Paket', 'Free')}
            <button
              onClick={handleSignOut}
              className="mt-4 px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              Sign out
            </button>
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Mode demo — tanpa akun. Semua dokumen tersimpan lokal di browser ini.
          </p>
        )}
      </section>

      <section className="p-6 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}>
        <h2 className="font-semibold mb-2">Tampilan</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm">Tema gelap / terang</span>
          <ThemeToggle />
        </div>
      </section>

      {!isSupabaseConfigured() && (
        <section className="p-6 rounded-xl border" style={{ borderColor: 'var(--danger)', backgroundColor: 'var(--bg-2)' }}>
          <h2 className="font-semibold mb-2" style={{ color: 'var(--danger)' }}>Zona berbahaya</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
            Hapus semua dokumen &amp; template demo di browser ini (termasuk dokumen contoh).
          </p>
          <button
            onClick={handleClearDemo}
            className="px-4 py-2 rounded-lg text-sm text-white"
            style={{ backgroundColor: 'var(--danger)' }}
          >
            Hapus data demo
          </button>
          {cleared && (
            <p className="text-sm mt-3" style={{ color: 'var(--accent)' }}>
              Data demo dihapus.
            </p>
          )}
        </section>
      )}
    </div>
  )
}
