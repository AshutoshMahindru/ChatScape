'use client'

import { useState } from 'react'
import { ParsedConversation } from '@/lib/parsers/types'
import { detectFormat } from '@/lib/parsers'

type ImportState = 'idle' | 'parsing' | 'preview' | 'importing' | 'success' | 'error'

export function useFileImport() {
  const [state, setState] = useState<ImportState>('idle')
  const [parsedConversation, setParsedConversation] = useState<ParsedConversation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importedId, setImportedId] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    try {
      setState('parsing')
      setError(null)
      setSelectedFile(file)

      // Read file content
      const content = await readFileContent(file)

      // Detect format and parse
      const parser = detectFormat(content, file.name)
      const parsed = parser(content)

      setParsedConversation(parsed)
      setState('preview')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to parse file. Please try again.'
      )
      setState('error')
      setParsedConversation(null)
    }
  }

  const handleImport = async () => {
    if (!parsedConversation || !selectedFile) {
      setError('No conversation to import')
      setState('error')
      return
    }

    try {
      setState('importing')
      setError(null)

      const response = await fetch('/api/conversations/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: parsedConversation,
          originalFilename: selectedFile.name,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to import conversation')
      }

      const result = await response.json()
      setImportedId(result.conversationId)
      setState('success')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to import conversation. Please try again.'
      )
      setState('error')
    }
  }

  const handleCancel = () => {
    setParsedConversation(null)
    setSelectedFile(null)
    setError(null)
    setState('idle')
  }

  const handleReset = () => {
    setParsedConversation(null)
    setSelectedFile(null)
    setError(null)
    setImportedId(null)
    setState('idle')
  }

  return {
    state,
    parsedConversation,
    error,
    importedId,
    handleFileSelect,
    handleImport,
    handleCancel,
    handleReset,
  }
}

function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content === 'string') {
        resolve(content)
      } else {
        reject(new Error('Failed to read file content'))
      }
    }
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    reader.readAsText(file)
  })
}
