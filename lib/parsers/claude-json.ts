import { ParsedConversation, ParsedMessage } from './types'

interface ClaudeChatMessage {
  uuid: string
  text: string
  sender: string
  created_at?: string
}

interface ClaudeExport {
  uuid: string
  name: string
  created_at: string
  updated_at: string
  chat_messages: ClaudeChatMessage[]
}

export function parseClaudeJson(content: string): ParsedConversation {
  try {
    const data: ClaudeExport = JSON.parse(content)

    if (!data.chat_messages || !Array.isArray(data.chat_messages)) {
      throw new Error('Invalid Claude export: missing chat_messages array')
    }

    // Extract title
    const title = data.name || 'Untitled Conversation'

    // Parse messages
    const messages: ParsedMessage[] = []
    const timestamps: Date[] = []

    for (const chatMessage of data.chat_messages) {
      const content = chatMessage.text.trim()
      if (!content) continue

      // Map sender to role
      let role: 'user' | 'assistant' | 'system' = 'user'
      if (chatMessage.sender === 'assistant') {
        role = 'assistant'
      } else if (chatMessage.sender === 'human') {
        role = 'user'
      }

      const message: ParsedMessage = {
        role,
        content,
      }

      // Parse timestamp if available
      if (chatMessage.created_at) {
        const timestamp = new Date(chatMessage.created_at)
        if (!isNaN(timestamp.getTime())) {
          message.timestamp = timestamp
          timestamps.push(timestamp)
        }
      }

      messages.push(message)
    }

    // Calculate first and last message timestamps
    let firstMessageAt: Date | undefined
    let lastMessageAt: Date | undefined

    if (timestamps.length > 0) {
      timestamps.sort((a, b) => a.getTime() - b.getTime())
      firstMessageAt = timestamps[0]
      lastMessageAt = timestamps[timestamps.length - 1]
    }

    return {
      title,
      messages,
      firstMessageAt,
      lastMessageAt,
      sourcePlatform: 'claude',
      sourceFormat: 'json',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Claude JSON: ${error.message}`)
    }
    throw new Error('Failed to parse Claude JSON: Unknown error')
  }
}
