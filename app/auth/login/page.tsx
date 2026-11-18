'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  // null di mode demo — form login tidak bisa dipakai tanpa Supabase.
  const supabase = createClient()
  const demoMode = !isSupabaseConfigured()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/app/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-2)' }}>Sign in to your DocSumm account</p>
        </div>

        <div className="p-8 rounded-xl border" style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-2)'
        }}>
          {demoMode ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                <strong style={{ color: 'var(--text-1)' }}>Mode demo aktif</strong> — Supabase
                belum terpasang di deployment ini, jadi belum ada akun untuk dimasuki.
                Kamu tetap bisa memakai semua fitur tanpa daftar: dokumen disimpan
                lokal di browser.
              </p>
              <Link
                href="/app/dashboard"
                className="block text-center w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Lanjutkan tanpa akun →
              </Link>
              <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
                Untuk mengaktifkan login: pasang NEXT_PUBLIC_SUPABASE_URL &amp;
                NEXT_PUBLIC_SUPABASE_ANON_KEY (lihat .env.example).
              </p>
            </div>
          ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{ 
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-1)'
                }}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border transition-colors"
                style={{ 
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text-1)'
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ 
                backgroundColor: 'var(--danger-bg)', 
                color: 'var(--danger)' 
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          )}

          {!demoMode && (
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-medium" style={{ color: 'var(--accent)' }}>
                Sign up
              </Link>
            </p>
          </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-3)' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
