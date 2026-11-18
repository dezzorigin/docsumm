'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'

// Guard sisi klien (pengganti middleware.ts — tidak bisa ikut static
// export). Mode Supabase: tanpa sesi → /auth/login. Mode demo: lolos
// tanpa akun. Worker juga menjaga hal yang sama di sisi server
// (worker/_worker.js) untuk request langsung.
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(!isSupabaseConfigured())

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = createClient()
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/auth/login')
      } else {
        setChecked(true)
      }
    })
  }, [router])

  if (!checked) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-current border-t-transparent mx-auto mb-4"
            style={{ color: 'var(--accent)' }}
          />
          <p style={{ color: 'var(--text-2)' }}>Checking session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
