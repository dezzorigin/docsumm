import { TemplateField } from '@/lib/types'

const inputStyle = {
  borderColor: 'var(--border)',
  backgroundColor: 'var(--bg)',
  color: 'var(--text-1)',
} as const

// Baris field yang bisa diedit (dulu hanya menampilkan label +
// tombol hapus; onUpdate tidak pernah bisa dipanggil dari UI).
export function FieldRow({
  field,
  onUpdate,
  onRemove,
}: {
  field: TemplateField
  onUpdate: (field: TemplateField) => void
  onRemove: () => void
}) {
  return (
    <div className="p-3 rounded-lg border space-y-2" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <input
          value={field.label}
          onChange={(e) => onUpdate({ ...field, label: e.target.value })}
          placeholder="Label field"
          aria-label="Label field"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border text-sm"
          style={inputStyle}
        />
        <label className="flex items-center gap-1 text-xs shrink-0" style={{ color: 'var(--text-2)' }}>
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
          />
          Wajib
        </label>
        <button onClick={onRemove} className="text-sm shrink-0" style={{ color: 'var(--danger)' }}>
          Hapus
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={field.key}
          onChange={(e) =>
            onUpdate({ ...field, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })
          }
          placeholder="key_field"
          aria-label="Key field"
          className="w-36 px-3 py-1.5 rounded-lg border text-xs"
          style={inputStyle}
        />
        <input
          value={field.description}
          onChange={(e) => onUpdate({ ...field, description: e.target.value })}
          placeholder="Deskripsi — apa yang harus diekstrak AI dari dokumen"
          aria-label="Deskripsi field"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border text-sm"
          style={inputStyle}
        />
      </div>
    </div>
  )
}
