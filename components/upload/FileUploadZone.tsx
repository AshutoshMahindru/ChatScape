'use client'

import { useRef, useState } from 'react'

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void
  isUploading: boolean
  acceptedExtensions?: string[]
  maxSizeBytes?: number
}

export default function FileUploadZone({
  onFileSelect,
  isUploading,
  acceptedExtensions = ['.json', '.html', '.md', '.txt'],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    setError(null)

    // Check file size
    if (file.size > maxSizeBytes) {
      setError(
        `File is too large. Please upload a file smaller than ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`
      )
      return false
    }

    // Check file extension
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedExtensions.includes(fileExtension)) {
      setError(
        `Unsupported file format. Please upload one of: ${acceptedExtensions.join(', ')}`
      )
      return false
    }

    return true
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }

  const handleChooseFile = () => {
    fileInputRef.current?.click()
  }

  const getContainerClasses = () => {
    const baseClasses =
      'relative flex flex-col items-center justify-center w-full min-h-64 px-6 py-10 border-2 border-dashed rounded-lg transition-all duration-200'

    if (error) {
      return `${baseClasses} border-red-500 bg-red-50`
    }

    if (isDragging) {
      return `${baseClasses} border-blue-500 bg-blue-50`
    }

    return `${baseClasses} border-gray-300 hover:border-gray-400 bg-white`
  }

  return (
    <div
      className={getContainerClasses()}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedExtensions.join(',')}
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing file...</p>
        </div>
      ) : (
        <>
          <div className="text-center space-y-4">
            <div className="text-5xl">📁</div>
            <div>
              <p className="text-xl font-medium text-gray-700 mb-2">
                Drop your chat export file here
              </p>
              <p className="text-gray-500 mb-4">or</p>
              <button
                onClick={handleChooseFile}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                disabled={isUploading}
              >
                Choose File
              </button>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Supported: ChatGPT, Claude exports</p>
              <p>Formats: {acceptedExtensions.join(', ')}</p>
              <p>Max size: {Math.round(maxSizeBytes / 1024 / 1024)}MB</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-800 text-sm font-medium">⚠️ {error}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
