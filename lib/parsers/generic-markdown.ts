import { ParsedConversation, ParsedMessage } from './types'

export function parseGenericMarkdown(content: string, filename?: string): ParsedConversation {
  try {
    // Extract title from first heading or use filename
    let title = 'Imported Document'
    const firstHeadingMatch = content.match(/^#\s+(.+)$/m)
    if (firstHeadingMatch) {
      title = firstHeadingMatch[1].trim()
    } else if (filename) {
      title = filename.replace(/\.(md|markdown|txt)$/i, '')
    }

    // Treat entire document as a single message
    const message: ParsedMessage = {
      role: 'assistant', // Documentation is treated as assistant-provided content
      content: content.trim(),
    }

    return {
      title,
      messages: [message],
      sourcePlatform: 'generic',
      sourceFormat: 'markdown',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Markdown document: ${error.message}`)
    }
    throw new Error('Failed to parse Markdown document: Unknown error')
  }
}
