'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Dashboard', href: '/app/dashboard', icon: '📊' },
    { label: 'Upload', href: '/app/upload', icon: '📤' },
    { label: 'Templates', href: '/app/templates', icon: '📝' },
    { label: 'Settings', href: '/app/settings', icon: '⚙️' },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t flex items-center justify-around safe-bottom z-50"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg)'
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 px-4 py-2 min-w-[44px]"
            style={{
              color: isActive ? 'var(--accent)' : 'var(--text-3)'
            }}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
