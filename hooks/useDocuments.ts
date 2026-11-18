import { useState, useEffect, useCallback } from 'react'
import { Document } from '@/lib/types'
import { isSupabaseConfigured } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { listDemoDocuments } from '@/lib/demo/store'

// Loader murni (tanpa setState) — dipanggil dari effect lewat async IIFE
// supaya tidak melanggar react-hooks/set-state-in-effect.
async function loadDocuments(): Promise<Document[]> {
  if (!isSupabaseConfigured()) {
    return listDemoDocuments()
  }
  const supabase = createClient()
  if (!supabase) throw new Error('Supabase tidak terkonfigurasi')
  const { data, error: dbError } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
  if (dbError) throw dbError
  return (data as Document[]) || []
}

// Hook for fetching and managing documents.
// Mode Supabase (env terpasang): baca tabel `documents` milik user.
// Mode demo: baca localStorage (lib/demo/store).
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDocuments(await loadDocuments())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const docs = await loadDocuments()
        if (!cancelled) setDocuments(docs)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch documents')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return { documents, loading, error, refetch: fetchDocuments }
}
