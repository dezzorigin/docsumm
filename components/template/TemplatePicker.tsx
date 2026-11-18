import { Template } from '@/lib/types'

export function TemplatePicker({
  templates,
  selectedId,
  onSelect,
}: {
  templates: Template[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  const btn = (active: boolean) => ({
    borderColor: active ? 'var(--accent)' : 'var(--border)',
    backgroundColor: active ? 'var(--accent-bg)' : 'transparent',
  })

  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-2">Select Template</h3>
      <button
        onClick={() => onSelect('')}
        className="w-full p-3 rounded-lg border text-left hover:border-current transition-colors"
        style={btn(!selectedId)}
      >
        <p className="font-medium text-sm">Ringkasan standar (tanpa template)</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
          Overview, poin kritis, action item, dan tanggal penting.
        </p>
      </button>
      {templates.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Belum ada template kustom — buat di halaman Templates.
        </p>
      ) : (
        templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="w-full p-3 rounded-lg border text-left hover:border-current transition-colors"
            style={btn(selectedId === template.id)}
          >
            <p className="font-medium text-sm">
              {template.name}
              {template.is_default && (
                <span
                  className="ml-2 px-2 py-0.5 rounded-full text-xs"
                  style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }}
                >
                  default
                </span>
              )}
            </p>
            {template.description && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>{template.description}</p>
            )}
          </button>
        ))
      )}
    </div>
  )
}
