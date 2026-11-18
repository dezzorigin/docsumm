import { TemplateField, OutputMode } from '@/lib/types'

export function TemplatePreview({
  fields,
  mode,
}: {
  fields: TemplateField[]
  mode: OutputMode
}) {
  return (
    <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}>
      <h3 className="font-semibold mb-3">Preview</h3>
      {fields.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Tambahkan field di atas untuk melihat preview hasil ekstraksi.
        </p>
      ) : mode === 'table' ? (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
          <table className="w-full text-sm">
            <tbody>
              {fields.map((f) => (
                <tr key={f.key} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3 font-medium w-1/3" style={{ backgroundColor: 'var(--bg-2)' }}>
                    {f.label}
                    {f.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                  </td>
                  <td className="p-3" style={{ color: 'var(--text-3)' }}>
                    nilai hasil ekstraksi…
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="text-sm space-y-2" style={{ color: 'var(--text-2)' }}>
          {fields.map((f) => (
            <li key={f.key}>
              <strong style={{ color: 'var(--text-1)' }}>{f.label}</strong>
              {f.required && <span style={{ color: 'var(--danger)' }}> *</span>}
              <span> — {f.description || 'tanpa deskripsi'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
