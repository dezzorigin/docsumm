import { useState, useEffect, useCallback } from 'react'
import { Template } from '@/lib/types'
import { isSupabaseConfigured } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { listDemoTemplates } from '@/lib/demo/store'

// Loader murni (tanpa setState) — dipanggil dari effect lewat async IIFE
// supaya tidak melanggar react-hooks/set-state-in-effect.
async function loadTemplates(): Promise<Template[]> {
  if (!isSupabaseConfigured()) {
    return listDemoTemplates()
  }
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase tidak terkonfigurasi')
  const { data, error: dbError } = await supabase
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false })
  if (dbError) throw dbError
  return (data as Template[]) || []
}

// Hook for fetching and managing templates.
// Mode Supabase: baca tabel `templates` milik user.
// Mode demo: baca localStorage (lib/demo/store).
export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTemplates(await loadTemplates())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const tpls = await loadTemplates()
        if (!cancelled) setTemplates(tpls)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch templates')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { templates, loading, error, refetch: fetchTemplates }
}
