'use client'

import { useEffect, useState } from 'react'

function readInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('theme') as 'light' | 'dark' | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  // Lazy initializer membaca localStorage / preferensi sistem — tanpa
  // setState di dalam effect (react-hooks/set-state-in-effect).
  // Effect di bawah hanya menyinkronkan atribut DOM (sistem eksternal).
  const [theme, setTheme] = useState<'light' | 'dark'>(readInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-2)]"
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}
