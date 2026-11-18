import Link from 'next/link'
import { Logo } from '@/components/shared/Logo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

// Navbar landing ala SaaS: logo kiri, navigasi tengah, GitHub + auth kanan.
// Link GitHub mengarah ke repo (syarat parameter "proper").
export function MarketingNav() {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur"
      style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--bg) 85%, transparent)' }}
    >
      <div className="max-w-[1080px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm" style={{ color: 'var(--text-2)' }}>
          <a href="#features" className="hover:opacity-70 transition-opacity">Fitur</a>
          <a href="#how-it-works" className="hover:opacity-70 transition-opacity">Cara kerja</a>
          <a href="#templates" className="hover:opacity-70 transition-opacity">Template</a>
          <a href="#faq" className="hover:opacity-70 transition-opacity">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="https://github.com/dezzorigin/docsumm"
            target="_blank"
            rel="noreferrer"
            aria-label="DocSumm di GitHub"
            title="DocSumm di GitHub"
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-2)]"
            style={{ color: 'var(--text-2)' }}
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </a>
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-2)]"
            style={{ color: 'var(--text-1)' }}
          >
            Sign In
          </Link>
          <Link
            href="/app/upload"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Coba gratis
          </Link>
        </div>
      </div>
    </header>
  )
}
