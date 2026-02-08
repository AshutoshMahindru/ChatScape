import { ParsedConversation, ParsedMessage } from './types'

export function parseClaudeMarkdown(content: string, filename?: string): ParsedConversation {
  try {
    // Extract title from first heading or use filename
    let title = 'Imported Conversation'
    const firstHeadingMatch = content.match(/^#\s+(.+)$/m)
    if (firstHeadingMatch) {
      title = firstHeadingMatch[1].trim()
    } else if (filename) {
      title = filename.replace(/\.(md|txt)$/i, '')
    }

    // Split by message markers (Human: or Assistant: or # Human or # Assistant)
    const messageMarkers = [
      /^#{1,3}\s*Human:?\s*$/gim,
      /^#{1,3}\s*Assistant:?\s*$/gim,
      /^Human:?\s*$/gim,
      /^Assistant:?\s*$/gim,
    ]

    // Find all marker positions
    const markers: Array<{ index: number; role: 'user' | 'assistant' }> = []

    for (const pattern of messageMarkers) {
      let match
      const regex = new RegExp(pattern.source, pattern.flags)
      while ((match = regex.exec(content)) !== null) {
        const matchText = match[0].toLowerCase()
        const role = matchText.includes('human') || matchText.includes('user') ? 'user' : 'assistant'
        markers.push({ index: match.index, role })
      }
    }

    // Sort markers by position
    markers.sort((a, b) => a.index - b.index)

    if (markers.length === 0) {
      throw new Error('No message markers found in markdown file')
    }

    // Extract messages between markers
    const messages: ParsedMessage[] = []

    for (let i = 0; i < markers.length; i++) {
      const marker = markers[i]
      const nextMarker = markers[i + 1]

      const start = marker.index
      const end = nextMarker ? nextMarker.index : content.length

      // Extract content between this marker and the next
      let messageContent = content.substring(start, end)

      // Remove the marker itself from the content
      messageContent = messageContent.replace(/^#{1,3}\s*(Human|Assistant):?\s*/i, '').trim()

      if (messageContent) {
        messages.push({
          role: marker.role,
          content: messageContent,
        })
      }
    }

    if (messages.length === 0) {
      throw new Error('No valid messages could be extracted from markdown')
    }

    return {
      title,
      messages,
      sourcePlatform: 'claude',
      sourceFormat: 'markdown',
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Claude Markdown: ${error.message}`)
    }
    throw new Error('Failed to parse Claude Markdown: Unknown error')
  }
}
