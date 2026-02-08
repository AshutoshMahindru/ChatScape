import { ParsedConversation, ParsedMessage } from './types'

interface ChatGPTNode {
  id: string
  message?: {
    author: {
      role: string
    }
    content: {
      parts: string[]
    }
    create_time?: number
  }
  children?: string[]
}

interface ChatGPTExport {
  title?: string
  mapping: Record<string, ChatGPTNode>
  create_time?: number
  update_time?: number
}

export function parseChatGptJson(content: string): ParsedConversation {
  try {
    const data: ChatGPTExport = JSON.parse(content)

    if (!data.mapping) {
      throw new Error('Invalid ChatGPT export: missing mapping field')
    }

    // Extract title
    const title = data.title || 'Untitled Conversation'

    // Find root node (node with no parent or first node)
    let rootId: string | null = null
    for (const [id, node] of Object.entries(data.mapping)) {
      if (node.children && node.children.length > 0 && !node.message) {
        rootId = id
        break
      }
    }

    // If no clear root found, use first node
    if (!rootId) {
      rootId = Object.keys(data.mapping)[0]
    }

    // Traverse tree depth-first to extract messages in order
    const messages: ParsedMessage[] = []
    const timestamps: number[] = []

    const traverse = (nodeId: string): void => {
      const node = data.mapping[nodeId]
      if (!node) return

      // Extract message if exists
      if (node.message && node.message.content && node.message.content.parts) {
        const role = node.message.author.role
        const content = node.message.content.parts.join('')

        // Only add messages with actual content
        if (content.trim()) {
          // Map role to our standard format
          let mappedRole: 'user' | 'assistant' | 'system' = 'user'
          if (role === 'assistant') mappedRole = 'assistant'
          else if (role === 'system') mappedRole = 'system'
          else if (role === 'user') mappedRole = 'user'

          const message: ParsedMessage = {
            role: mappedRole,
            content: content.trim(),
          }

          // Add timestamp if available (convert Unix epoch to Date)
          if (node.message.create_time) {
            message.timestamp = new Date(node.message.create_time * 1000)
            timestamps.push(node.message.create_time)
          }

          messages.push(message)
        }
      }

      // Traverse children
      if (node.children) {
        for (const childId of node.children) {
          traverse(childId)
        }
      }
    }

    traverse(rootId)

    // Calculate first and last message timestamps
    let firstMessageAt: Date | undefined
    let lastMessageAt: Date | undefined

    if (timestamps.length > 0) {
      const sortedTimestamps = timestamps.sort((a, b) => a - b)
      firstMessageAt = new Date(sortedTimestamps[0] * 1000)
      lastMessageAt = new Date(sortedTimestamps[sortedTimestamps.length - 1] * 1000)
    }

    return {
      title,
      messages,
      firstMessageAt,
      lastMessageAt,
      sourcePlatform: 'chatgpt',
      sourceFormat: 'json',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse ChatGPT JSON: ${error.message}`)
    }
    throw new Error('Failed to parse ChatGPT JSON: Unknown error')
  }
}
