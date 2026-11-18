import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/config'
import { extractPdfText } from '@/lib/demo/extractPdfText'
import { saveDemoDocument, updateDemoDocument } from '@/lib/demo/store'
import type { SummaryOutput, Template } from '@/lib/types'

// Alur upload — dulu memanggil POST /api/summarize { documentId },
// padahal route itu hanya placeholder 501, jadi TIDAK ADA SATU PUN
// dokumen yang pernah selesai diproses. Alur sekarang:
//
//   file → ekstrak teks di browser (PDF via pdfjs-dist; gambar dikirim
//   ke worker untuk OCR) → POST /api/summarize { text | imageBase64 }
//   (worker: AI bila OPENROUTER_API_KEY ada, kalau tidak ringkasan
//   ekstraktif) → simpan hasil.
//
// Mode Supabase: file juga diunggah ke Storage + baris dibuat di tabel
// `documents` (status processing → done/error). Mode demo: semuanya
// disimpan di localStorage, tanpa akun.
export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // template opsional: bila dipilih, ringkasan memakai mode tabel
  // mengikuti field template (lihat worker/_worker.js).
  const upload = async (file: File, template?: Template | null) => {
    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const documentId = crypto.randomUUID()
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileType = fileExt === 'pdf' ? 'pdf' : 'image'
      const demoMode = !isSupabaseConfigured()

      // --- Mode Supabase: upload file + buat baris dokumen --------------
      if (!demoMode) {
        const supabase = createClient()
        if (!supabase) throw new Error('Supabase tidak terkonfigurasi')
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        setProgress(10)
        setCurrentStep('Uploading file...')
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${documentId}/${fileName}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, { cacheControl: '3600', upsert: false })
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('documents').getPublicUrl(filePath)

        const { error: docError } = await supabase.from('documents').insert({
          id: documentId,
          user_id: user.id,
          title: file.name,
          file_url: publicUrl,
          file_type: fileType,
          status: 'processing',
          output_mode: template ? 'table' : 'card',
          template_id: template?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        if (docError) throw docError
      } else {
        // Mode demo: buat baris lokal dulu supaya halaman hasil sudah
        // punya sesuatu untuk ditampilkan walau ringkasan gagal.
        saveDemoDocument({
          id: documentId,
          user_id: 'demo',
          title: file.name,
          file_url: '',
          file_type: fileType,
          status: 'processing',
          output_mode: template ? 'table' : 'card',
          template_id: template?.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // --- Ekstrak teks / OCR -------------------------------------------
      setProgress(35)
      setCurrentStep(fileType === 'pdf' ? 'Extracting text from PDF...' : 'Reading image...')

      let summary: SummaryOutput
      let pageCount: number | undefined

      if (fileType === 'pdf') {
        const { text, pageCount: pages, truncated } = await extractPdfText(file)
        if (!text) throw new Error('Tidak ada teks yang bisa dibaca dari PDF ini (mungkin hasil scan gambar — coba unggah sebagai gambar).')
        if (truncated) setCurrentStep('PDF panjang — hanya bagian awal yang dirangkum.')
        pageCount = pages
        summary = await summarize({ text, title: file.name, template: template ?? undefined })
      } else {
        // Gambar: OCR dikerjakan worker (butuh OPENROUTER_API_KEY).
        const imageBase64 = await fileToDataUrl(file)
        summary = await summarize({ imageBase64, title: file.name, template: template ?? undefined })
      }

      // --- Simpan hasil ---------------------------------------------------
      setProgress(90)
      setCurrentStep('Saving summary...')
      const now = new Date().toISOString()
      if (demoMode) {
        updateDemoDocument(documentId, {
          status: 'done',
          summary_json: summary,
          page_count: pageCount,
          updated_at: now,
        })
      } else {
        const supabase = createClient()
        if (!supabase) throw new Error('Supabase tidak terkonfigurasi')
        const { error: updError } = await supabase
          .from('documents')
          .update({ status: 'done', summary_json: summary, page_count: pageCount, updated_at: now })
          .eq('id', documentId)
        if (updError) throw updError
      }

      setProgress(100)
      setCurrentStep('Complete!')
      return { success: true, documentId }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      return { success: false, documentId: null }
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, progress, currentStep, error }
}

async function summarize(body: { text?: string; imageBase64?: string; title: string; template?: Template }): Promise<SummaryOutput> {
  const response = await fetch('/api/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      data.error || `Summarization failed (${response.status})`
    )
  }
  return data.summary as SummaryOutput
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'))
    reader.readAsDataURL(file)
  })
}
