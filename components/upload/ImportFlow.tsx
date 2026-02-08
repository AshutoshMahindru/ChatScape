'use client'

import { useRouter } from 'next/navigation'
import { useFileImport } from '@/hooks/useFileImport'
import FileUploadZone from './FileUploadZone'
import ConversationPreview from './ConversationPreview'
import ConversationList from './ConversationList'

export default function ImportFlow() {
  const router = useRouter()
  const {
    state,
    parsedConversation,
    error,
    importedId,
    handleFileSelect,
    handleImport,
    handleCancel,
    handleReset,
  } = useFileImport()

  const handleConversationSelect = (conversationId: string) => {
    router.push(`/conversations/${conversationId}`)
  }

  return (
    <div className="space-y-8">
      {/* File Upload or Preview */}
      {state === 'idle' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Import Conversation
          </h2>
          <FileUploadZone
            onFileSelect={handleFileSelect}
            isUploading={false}
          />
        </div>
      )}

      {state === 'parsing' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700">Parsing file...</p>
          </div>
        </div>
      )}

      {state === 'preview' && parsedConversation && (
        <ConversationPreview
          conversation={parsedConversation}
          onImport={handleImport}
          onCancel={handleCancel}
          isImporting={false}
        />
      )}

      {state === 'importing' && parsedConversation && (
        <ConversationPreview
          conversation={parsedConversation}
          onImport={handleImport}
          onCancel={handleCancel}
          isImporting={true}
        />
      )}

      {state === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-semibold text-green-900 mb-2">
            Conversation imported successfully!
          </h2>
          <p className="text-green-700 mb-6">
            {parsedConversation?.messages.length} messages imported
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleReset}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-red-900 mb-2">
            Import Failed
          </h2>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Conversation List */}
      {(state === 'idle' || state === 'success') && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <ConversationList
            showUploadPrompt={state === 'idle'}
            onSelect={handleConversationSelect}
          />
        </div>
      )}
    </div>
  )
}
