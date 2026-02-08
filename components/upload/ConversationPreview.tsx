'use client'

import { ParsedConversation } from '@/lib/parsers/types'

interface ConversationPreviewProps {
  conversation: ParsedConversation
  onImport: () => void
  onCancel: () => void
  isImporting?: boolean
}

export default function ConversationPreview({
  conversation,
  onImport,
  onCancel,
  isImporting = false,
}: ConversationPreviewProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return '👤'
      case 'assistant':
        return '🤖'
      case 'system':
        return '⚙️'
      default:
        return '💬'
    }
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const previewMessages = conversation.messages.slice(0, 5)
  const hasMoreMessages = conversation.messages.length > 5

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conversation Preview</h2>
        <div className="h-1 w-16 bg-blue-600 rounded"></div>
      </div>

      {/* Metadata */}
      <div className="mb-6 space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{conversation.title}</h3>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Messages:</span>
            <span>{conversation.messages.length}</span>
          </div>

          {conversation.firstMessageAt && conversation.lastMessageAt && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Date Range:</span>
              <span>
                {formatDate(conversation.firstMessageAt)} -{' '}
                {formatDate(conversation.lastMessageAt)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="font-medium">Source:</span>
            <span className="capitalize">
              {conversation.sourcePlatform} ({conversation.sourceFormat})
            </span>
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Message Preview:</h4>
        <div className="space-y-3 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
          {previewMessages.map((message, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 text-2xl">{getRoleIcon(message.role)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {message.role}
                  </span>
                  {message.timestamp && (
                    <span className="text-xs text-gray-500">
                      {formatDate(message.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 break-words">
                  {truncateContent(message.content)}
                </p>
              </div>
            </div>
          ))}

          {hasMoreMessages && (
            <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-200">
              + {conversation.messages.length - 5} more messages
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onCancel}
          disabled={isImporting}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onImport}
          disabled={isImporting}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isImporting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Importing...</span>
            </>
          ) : (
            'Import Conversation'
          )}
        </button>
      </div>
    </div>
  )
}
