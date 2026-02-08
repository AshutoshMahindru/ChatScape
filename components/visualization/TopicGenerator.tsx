'use client'

import { TopicGeneratorProps, GenerateTopicsProgress } from '@/lib/visualization/types'
import { useEffect, useRef, useState } from 'react'

export default function TopicGenerator({
  conversationId,
  current,
  total,
  onComplete,
  onCancel,
}: TopicGeneratorProps) {
  const [progress, setProgress] = useState({ current, total })
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    // Don't start if already complete
    if (current >= total) {
      onComplete()
      return
    }

    // Create SSE connection
    const eventSource = new EventSource(
      `/api/conversations/${conversationId}/generate-topics`
    )
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data: GenerateTopicsProgress = JSON.parse(event.data)

        if (data.type === 'progress') {
          setProgress({
            current: data.current || 0,
            total: data.total || total,
          })
        } else if (data.type === 'complete') {
          eventSource.close()
          onComplete()
        } else if (data.type === 'error') {
          setError(data.error || 'Failed to generate topics')
          eventSource.close()
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
      setError('Connection lost. Please try again.')
      eventSource.close()
    }

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [conversationId, current, total, onComplete])

  const handleCancel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }
    onCancel()
  }

  const percentage = total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold text-red-900 mb-2">
              Generation Failed
            </h2>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="text-center">
          {/* Animated Spinner */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Generating topics...
          </h2>

          <p className="text-gray-600 mb-6">
            Processing message {progress.current} of {progress.total}
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{percentage}% complete</p>
          </div>

          <button
            onClick={handleCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
