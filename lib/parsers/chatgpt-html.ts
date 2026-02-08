import { ParsedConversation, ParsedMessage } from './types'

export function parseChatGptHtml(content: string): ParsedConversation {
  try {
    // Use DOMParser in browser, or create a simple fallback
    let doc: Document
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser()
      doc = parser.parseFromString(content, 'text/html')
    } else {
      // Server-side fallback: throw error for now
      // In production, you'd use a library like jsdom or node-html-parser
      throw new Error('HTML parsing is only supported in browser environment')
    }

    // Extract title
    let title = 'Imported Conversation'
    const titleElement = doc.querySelector('title')
    if (titleElement && titleElement.textContent) {
      title = titleElement.textContent.trim()
    } else {
      const h1Element = doc.querySelector('h1')
      if (h1Element && h1Element.textContent) {
        title = h1Element.textContent.trim()
      }
    }

    // Try different selectors for message elements
    const messageSelectors = [
      '.conversation-turn',
      '.message',
      '[data-role]',
      '.user-message, .assistant-message',
      'div[class*="message"]',
    ]

    let messageElements: Element[] = []
    for (const selector of messageSelectors) {
      messageElements = Array.from(doc.querySelectorAll(selector))
      if (messageElements.length > 0) break
    }

    if (messageElements.length === 0) {
      throw new Error(
        'No messages found in HTML. The file may not be a valid ChatGPT export.'
      )
    }

    // Extract messages
    const messages: ParsedMessage[] = []

    for (const element of messageElements) {
      // Determine role from class names or data attributes
      let role: 'user' | 'assistant' | 'system' = 'user'

      const classes = element.className.toLowerCase()
      const dataRole = element.getAttribute('data-role')?.toLowerCase()

      if (dataRole === 'assistant' || classes.includes('assistant')) {
        role = 'assistant'
      } else if (dataRole === 'system' || classes.includes('system')) {
        role = 'system'
      } else if (dataRole === 'user' || classes.includes('user')) {
        role = 'user'
      }

      // Extract content (use textContent to strip HTML tags)
      const content = element.textContent?.trim() || ''

      if (content) {
        const message: ParsedMessage = {
          role,
          content,
        }

        // Try to extract timestamp if available
        const timestampAttr = element.getAttribute('data-timestamp')
        if (timestampAttr) {
          const timestamp = parseInt(timestampAttr, 10)
          if (!isNaN(timestamp)) {
            message.timestamp = new Date(timestamp * 1000)
          }
        }

        messages.push(message)
      }
    }

    if (messages.length === 0) {
      throw new Error('No valid messages could be extracted from HTML')
    }

    // Calculate first and last message timestamps
    const timestamps = messages
      .map((m) => m.timestamp)
      .filter((t): t is Date => t !== undefined)

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
      sourcePlatform: 'chatgpt',
      sourceFormat: 'html',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse ChatGPT HTML: ${error.message}`)
    }
    throw new Error('Failed to parse ChatGPT HTML: Unknown error')
  }
}
