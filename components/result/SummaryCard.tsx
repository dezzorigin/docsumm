export function SummaryCard({ 
  label, 
  icon, 
  variant = 'default',
  children 
}: { 
  label: string
  icon?: string
  variant?: 'default' | 'danger' | 'success' | 'warning'
  children: React.ReactNode
}) {
  return (
    <div className="p-4 rounded-lg border-l-4" style={{ 
      borderColor: variant === 'danger' ? 'var(--danger)' : variant === 'warning' ? 'var(--warn)' : 'var(--accent)',
      backgroundColor: 'var(--bg-2)'
    }}>
      <div className="text-eyebrow mb-2" style={{ color: 'var(--accent)' }}>
        {icon ? `${icon} ${label}` : label}
      </div>
      {children}
    </div>
  )
}
