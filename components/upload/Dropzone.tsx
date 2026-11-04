'use client'

import { useState, useCallback } from 'react'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif']
}

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export function Dropzone({ 
  onFileSelect, 
  accept = ['pdf', 'jpg', 'png', 'tiff'],
  maxSize = MAX_SIZE 
}: { 
  onFileSelect: (file: File) => void
  accept?: string[]
  maxSize?: number
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`
    }

    // Check file type
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !accept.includes(fileExt)) {
      return `Invalid file type. Accepted: ${accept.join(', ').toUpperCase()}`
    }

    return null
  }, [accept, maxSize])

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }

    setError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleClear = useCallback(() => {
    setSelectedFile(null)
    setError(null)
  }, [])

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className="relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer"
        style={{
          borderColor: isDragging ? 'var(--accent)' : error ? 'var(--danger)' : 'var(--border)',
          backgroundColor: isDragging ? 'var(--accent-bg)' : 'var(--bg-2)',
          borderRadius: '16px'
        }}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={Object.keys(ACCEPTED_TYPES).join(',')}
          onChange={handleFileInput}
        />

        {!selectedFile ? (
          <>
            <div className="mb-4 text-4xl">📄</div>
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? 'Drop file here' : 'Upload Document'}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
              Drag and drop your file here, or click to browse
            </p>
            <label
              htmlFor="file-upload"
              className="inline-block px-6 py-2 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Browse Files
            </label>
            <p className="text-xs mt-4" style={{ color: 'var(--text-3)' }}>
              Supported: {accept.map(t => t.toUpperCase()).join(', ')} · Max {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-4xl">✅</div>
            <div>
              <p className="font-medium mb-1">{selectedFile.name}</p>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleClear}
              className="text-sm px-4 py-2 rounded-lg border transition-colors"
              style={{
                borderColor: 'var(--border)',
                color: 'var(--text-2)'
              }}
            >
              Choose Different File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 rounded-lg text-sm" style={{
          backgroundColor: 'var(--danger-bg)',
          color: 'var(--danger)'
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
