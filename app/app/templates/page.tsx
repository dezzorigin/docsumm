'use client'

import { useState } from 'react'
import { useTemplates } from '@/hooks/useTemplates'
import { FieldRow } from '@/components/template/FieldRow'
import { TemplatePreview } from '@/components/template/TemplatePreview'
import { EmptyState } from '@/components/shared/EmptyState'
import { isSupabaseConfigured } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { saveDemoTemplate, deleteDemoTemplate } from '@/lib/demo/store'
import type { Template, TemplateField, OutputMode } from '@/lib/types'

const inputStyle = {
  borderColor: 'var(--border)',
  backgroundColor: 'var(--bg)',
  color: 'var(--text-1)',
} as const

function newField(n: number): TemplateField {
  return { key: `field_${n}`, label: '', description: '', required: false }
}

export default function TemplatesPage() {
  const { templates, loading, refetch } = useTemplates()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<OutputMode>('table')
  const [fields, setFields] = useState<TemplateField[]>([newField(1), newField(2)])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState('')

  const handleSave = async () => {
    setError(null)
    setSavedMsg('')
    const cleanFields = fields.filter((f) => f.label.trim() && f.key.trim())
    if (!name.trim()) {
      setError('Nama template wajib diisi.')
      return
    }
    if (cleanFields.length === 0) {
      setError('Tambahkan minimal satu field dengan label terisi.')
      return
    }
    setSaving(true)
    try {
      const tpl: Template = {
        id: crypto.randomUUID(),
        user_id: 'demo',
        name: name.trim(),
        description: description.trim() || undefined,
        fields: cleanFields,
        output_mode: mode,
        is_default: templates.length === 0,
        created_at: new Date().toISOString(),
      }
      if (!isSupabaseConfigured()) {
        saveDemoTemplate(tpl)
      } else {
        const supabase = createClient()
        if (!supabase) throw new Error('Supabase tidak terkonfigurasi')
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { error: dbError } = await supabase
          .from('templates')
          .insert({ ...tpl, user_id: user.id })
        if (dbError) throw dbError
      }
      setName('')
      setDescription('')
      setFields([newField(1), newField(2)])
      setSavedMsg(`Template "${tpl.name}" tersimpan.`)
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, tplName: string) => {
    if (!window.confirm(`Hapus template "${tplName}"?`)) return
    if (!isSupabaseConfigured()) {
      deleteDemoTemplate(id)
    } else {
      const supabase = createClient()
      if (supabase) await supabase.from('templates').delete().eq('id', id)
    }
    refetch()
  }

  const handleSetDefault = async (id: string) => {
    if (!isSupabaseConfigured()) {
      templates.forEach((t) => saveDemoTemplate({ ...t, is_default: t.id === id }))
    } else {
      const supabase = createClient()
      if (!supabase) return
      await supabase.from('templates').update({ is_default: false }).neq('id', id)
      await supabase.from('templates').update({ is_default: true }).eq('id', id)
    }
    refetch()
  }

  return (
    <div className="p-6 max-w-[900px] mx-auto space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Templates
        </h1>
        <p style={{ color: 'var(--text-2)' }}>
          Buat template ekstraksi sendiri — field yang kamu tentukan jadi kolom hasil ringkasan.
        </p>
      </div>

      {/* Builder */}
      <section className="p-6 rounded-xl border space-y-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}>
        <h2 className="text-lg font-semibold">Buat template baru</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tpl-name" className="block text-sm font-medium mb-2">Nama template</label>
            <input
              id="tpl-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Laporan Inspeksi Kapal"
              className="w-full px-4 py-2 rounded-lg border"
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="tpl-mode" className="block text-sm font-medium mb-2">Mode output</label>
            <select
              id="tpl-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value as OutputMode)}
              className="w-full px-4 py-2 rounded-lg border"
              style={inputStyle}
            >
              <option value="table">Tabel — satu baris per field</option>
              <option value="card">Kartu — ringkasan standar</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="tpl-desc" className="block text-sm font-medium mb-2">Deskripsi (opsional)</label>
          <input
            id="tpl-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Untuk dokumen apa template ini dipakai"
            className="w-full px-4 py-2 rounded-lg border"
            style={inputStyle}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Field ekstraksi</h3>
            <button
              onClick={() => setFields([...fields, newField(fields.length + 1)])}
              className="text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              + Tambah field
            </button>
          </div>
          {fields.map((f, i) => (
            <FieldRow
              key={i}
              field={f}
              onUpdate={(next) => setFields(fields.map((x, j) => (j === i ? next : x)))}
              onRemove={() => setFields(fields.filter((_, j) => j !== i))}
            />
          ))}
        </div>

        <TemplatePreview fields={fields.filter((f) => f.label.trim())} mode={mode} />

        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}
        {savedMsg && (
          <p className="text-sm" style={{ color: 'var(--accent)' }}>{savedMsg}</p>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {saving ? 'Menyimpan...' : 'Simpan template'}
        </button>
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Template yang disimpan bisa dipilih di halaman Upload — ringkasan dokumen
          lalu mengikuti field template ini (mode tabel), bukan mode kartu standar.
        </p>
      </section>

      {/* List */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Template saya</h2>
        {loading ? (
          <p style={{ color: 'var(--text-2)' }}>Loading...</p>
        ) : templates.length === 0 ? (
          <EmptyState
            title="Belum ada template"
            description="Buat template pertamamu dengan builder di atas."
          />
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-2)' }}
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {t.name}
                    {t.is_default && (
                      <span
                        className="ml-2 px-2 py-0.5 rounded-full text-xs"
                        style={{ backgroundColor: 'var(--accent-bg)', color: 'var(--accent)' }}
                      >
                        default
                      </span>
                    )}
                  </p>
                  {t.description && (
                    <p className="text-sm" style={{ color: 'var(--text-2)' }}>{t.description}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                    {t.fields.length} field · mode {t.output_mode}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {!t.is_default && (
                    <button onClick={() => handleSetDefault(t.id)} className="text-sm" style={{ color: 'var(--accent)' }}>
                      Jadikan default
                    </button>
                  )}
                  <button onClick={() => handleDelete(t.id, t.name)} className="text-sm" style={{ color: 'var(--danger)' }}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
