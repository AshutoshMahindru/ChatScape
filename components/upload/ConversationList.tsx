'use client'

import { useEffect, useState } from 'react'

interface Conversation {
  id: string
  title: string
  message_count: number
  source_platform: string
  source_format: string
  imported_at: string
  created_at: string
}

interface ConversationListProps {
  onSelect?: (conversationId: string) => void
  showUploadPrompt?: boolean
}

export default function ConversationList({
  onSelect,
  showUploadPrompt = false,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/conversations')
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'chatgpt':
        return '🤖'
      case 'claude':
        return '🧠'
      case 'generic':
        return '💬'
      default:
        return '📄'
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 mb-4">⚠️ {error}</p>
        <button
          onClick={fetchConversations}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (conversations.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No conversations yet
        </h3>
        <p className="text-gray-600 mb-6">
          {showUploadPrompt
            ? 'Upload your first chat export to get started'
            : 'Import a conversation to see it here'}
        </p>
      </div>
    )
  }

  // Conversation list
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        My Conversations ({conversations.length})
      </h2>
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          onClick={() => onSelect?.(conversation.id)}
          className={`bg-white border border-gray-200 rounded-lg p-6 transition-all ${
            onSelect
              ? 'cursor-pointer hover:border-blue-500 hover:shadow-md'
              : ''
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">{getPlatformIcon(conversation.source_platform)}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                {conversation.title}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{conversation.message_count}</span>
                  <span>messages</span>
                </div>
                <div>
                  Imported {formatDate(conversation.imported_at)}
                </div>
                <div className="capitalize">
                  {conversation.source_platform} ({conversation.source_format})
                </div>
              </div>
            </div>
            {onSelect && (
              <div className="text-gray-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
