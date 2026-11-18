import Link from 'next/link'

const SIZES = { sm: 22, md: 28, lg: 36 } as const

export function Logo({ size = 'md', showText = true }: { size?: 'sm' | 'md' | 'lg'; showText?: boolean }) {
  const px = SIZES[size]
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="DocSumm — beranda">
      <svg
        width={px}
        height={px}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <rect x="5" y="3" width="17" height="26" rx="3" fill="var(--accent)" />
        <rect x="9" y="9" width="9" height="2" rx="1" fill="#fff" opacity="0.95" />
        <rect x="9" y="14" width="9" height="2" rx="1" fill="#fff" opacity="0.7" />
        <rect x="9" y="19" width="6" height="2" rx="1" fill="#fff" opacity="0.7" />
        <circle cx="23" cy="23" r="6" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
        <path
          d="M20.5 23l1.8 1.8 3.2-3.6"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span
          className="font-bold"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: size === 'lg' ? 22 : size === 'sm' ? 15 : 18,
            color: 'var(--text-1)',
          }}
        >
          DocSumm
        </span>
      )}
    </Link>
  )
}
