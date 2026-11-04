import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Hook for file upload functionality
export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const upload = async (file: File) => {
    setUploading(true)
    setProgress(0)
    setError(null)
    setCurrentStep('Preparing upload...')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Generate document ID
      const documentId = crypto.randomUUID()
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${documentId}/${fileName}`

      // Determine file type
      const fileType = fileExt === 'pdf' ? 'pdf' : 'image'

      setProgress(10)
      setCurrentStep('Uploading file...')

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      setProgress(40)
      setCurrentStep('Creating record...')

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          user_id: user.id,
          title: file.name,
          file_url: publicUrl,
          file_type: fileType,
          status: 'processing',
          output_mode: 'card',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (docError) throw docError

      setProgress(60)
      setCurrentStep('Processing document...')

      // Call summarize API
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Summarization failed')
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
