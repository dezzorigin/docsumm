export function ProgressCard({ 
  filename, 
  progress, 
  step 
}: { 
  filename: string
  progress: number
  step: string
}) {
  return (
    <div className="p-6 rounded-xl border" style={{ 
      borderColor: 'var(--border)',
      backgroundColor: 'var(--bg-2)'
    }}>
      <div className="text-center mb-6">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-current border-t-transparent mx-auto mb-4" 
             style={{ color: 'var(--accent)' }} 
        />
        <h3 className="font-semibold mb-1">{filename}</h3>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>{step}</p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'var(--bg-3)' }}>
        <div 
          className="h-full transition-all duration-300 ease-linear rounded-full"
          style={{ 
            width: `${progress}%`,
            backgroundColor: 'var(--accent)'
          }}
        />
      </div>

      <div className="mt-2 text-right">
        <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
          {progress}%
        </span>
      </div>
    </div>
  )
}
