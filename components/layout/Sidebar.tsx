'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/Logo'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  // createClient() mengembalikan null di mode demo — jangan crash.
  const supabase = createClient()

  const navItems = [
    { label: 'Dashboard', href: '/app/dashboard', icon: '📊' },
    { label: 'Upload', href: '/app/upload', icon: '📤' },
    { label: 'Templates', href: '/app/templates', icon: '📝' },
    { label: 'Settings', href: '/app/settings', icon: '⚙️' },
  ]

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside
      className="w-48 border-r p-4 hidden md:flex flex-col"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="mb-8">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor: isActive ? 'var(--accent-bg)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-2)',
                fontWeight: isActive ? 500 : 400
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {!isSupabaseConfigured() && (
        <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }}>
          Mode demo — tanpa akun
        </p>
      )}

      <button
        onClick={handleLogout}
        className="w-full px-3 py-2 rounded-lg text-sm text-left transition-colors"
        style={{ color: 'var(--text-2)' }}
      >
        {isSupabaseConfigured() ? '🚪 Logout' : '🚪 Keluar ke beranda'}
      </button>
    </aside>
  )
}
