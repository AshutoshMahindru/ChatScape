import { ParsedConversation, ParsedMessage } from './types'

interface GenericMessage {
  role: string
  content: string
  timestamp?: string | number
}

interface GenericExport {
  title?: string
  messages: GenericMessage[]
  timestamp?: string | number
}

export function parseGenericJson(content: string): ParsedConversation {
  try {
    const data: GenericExport = JSON.parse(content)

    if (!data.messages || !Array.isArray(data.messages)) {
      throw new Error('Invalid JSON: missing messages array')
    }

    // Extract title
    const title = data.title || 'Imported Conversation'

    // Parse messages
    const messages: ParsedMessage[] = []
    const timestamps: Date[] = []

    for (const msg of data.messages) {
      if (!msg.role || !msg.content) {
        continue // Skip messages without required fields
      }

      const content = msg.content.trim()
      if (!content) continue

      // Map role to standard format
      let role: 'user' | 'assistant' | 'system' = 'user'
      const normalizedRole = msg.role.toLowerCase()
      if (normalizedRole === 'assistant' || normalizedRole === 'bot' || normalizedRole === 'ai') {
        role = 'assistant'
      } else if (normalizedRole === 'system') {
        role = 'system'
      }

      const message: ParsedMessage = {
        role,
        content,
      }

      // Parse timestamp if available
      if (msg.timestamp) {
        let timestamp: Date | undefined
        if (typeof msg.timestamp === 'string') {
          timestamp = new Date(msg.timestamp)
        } else if (typeof msg.timestamp === 'number') {
          // Try as milliseconds first, then seconds if it seems too small
          timestamp =
            msg.timestamp > 10000000000
              ? new Date(msg.timestamp)
              : new Date(msg.timestamp * 1000)
        }

        if (timestamp && !isNaN(timestamp.getTime())) {
          message.timestamp = timestamp
          timestamps.push(timestamp)
        }
      }

      messages.push(message)
    }

    if (messages.length === 0) {
      throw new Error('No valid messages found in JSON')
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
      sourcePlatform: 'generic',
      sourceFormat: 'json',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse generic JSON: ${error.message}`)
    }
    throw new Error('Failed to parse generic JSON: Unknown error')
  }
}
