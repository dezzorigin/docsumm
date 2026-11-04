'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dropzone } from '@/components/upload/Dropzone'
import { ProgressCard } from '@/components/upload/ProgressCard'
import { useUpload } from '@/hooks/useUpload'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { upload, uploading, progress, currentStep, error } = useUpload()
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const result = await upload(selectedFile)
    
    if (result.success && result.documentId) {
      // Redirect to result page
      router.push(`/app/result/${result.documentId}`)
    }
  }

  return (
    <div className="p-6 max-w-[520px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Upload Document
        </h1>
        <p style={{ color: 'var(--text-2)' }}>
          Upload any PDF or image document for AI-powered summarization
        </p>
      </div>

      {!uploading ? (
        <>
          <Dropzone onFileSelect={handleFileSelect} />
          
          {selectedFile && (
            <button
              onClick={handleUpload}
              className="w-full mt-6 px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              Process Document
            </button>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-lg border" style={{
              backgroundColor: 'var(--danger-bg)',
              borderColor: 'var(--danger)',
              color: 'var(--danger)'
            }}>
              <p className="font-medium mb-1">Upload Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8 p-6 rounded-lg border" style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--bg-2)'
          }}>
            <h3 className="font-semibold mb-3">💡 What happens next?</h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-2)' }}>
              <li>• Your document will be uploaded securely</li>
              <li>• AI will extract text via OCR (if image)</li>
              <li>• AI will generate a structured summary</li>
              <li>• You'll see results in 5-15 seconds</li>
            </ul>
          </div>
        </>
      ) : (
        <ProgressCard 
          filename={selectedFile?.name || 'Document'}
          progress={progress}
          step={currentStep}
        />
      )}
    </div>
  )
}
