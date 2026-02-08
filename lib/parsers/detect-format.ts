import { Parser } from './types'
import { parseChatGptJson } from './chatgpt-json'
import { parseChatGptHtml } from './chatgpt-html'
import { parseClaudeJson } from './claude-json'
import { parseClaudeMarkdown } from './claude-markdown'
import { parseGenericJson } from './generic-json'
import { parseGenericMarkdown } from './generic-markdown'

export function detectFormat(content: string, filename: string): Parser {
  // First, try to detect if it's JSON
  const trimmedContent = content.trim()

  if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
    try {
      const json = JSON.parse(content)

      // Check for ChatGPT format (has mapping field)
      if (json.mapping && typeof json.mapping === 'object') {
        return parseChatGptJson
      }

      // Check for Claude format (has chat_messages array)
      if (json.chat_messages && Array.isArray(json.chat_messages)) {
        return parseClaudeJson
      }

      // Check for generic format (has messages array)
      if (json.messages && Array.isArray(json.messages)) {
        return parseGenericJson
      }

      // JSON but unknown structure - try generic parser as fallback
      if (json.messages) {
        return parseGenericJson
      }

      throw new Error('JSON file does not match any known format')
    } catch (error) {
      // If JSON.parse fails, continue to file extension detection
      if (error instanceof SyntaxError) {
        // Not valid JSON, fall through to extension detection
      } else {
        throw error
      }
    }
  }

  // Check file extension for non-JSON formats
  const lowerFilename = filename.toLowerCase()

  if (lowerFilename.endsWith('.html') || lowerFilename.endsWith('.htm')) {
    return parseChatGptHtml
  }

  if (lowerFilename.endsWith('.md') || lowerFilename.endsWith('.markdown')) {
    // Check if it has conversation markers
    const hasConversationMarkers = /^(#{1,3}\s*)?(Human|User|Assistant|AI|Claude|GPT):?\s*$/im.test(content) ||
                                   /^\*\*\s*(Human|User|Assistant|AI):?\s*\*\*\s*$/im.test(content) ||
                                   /^-+\s*(Human|User|Assistant|AI)\s*-+$/im.test(content)

    if (hasConversationMarkers) {
      return parseClaudeMarkdown
    } else {
      // Treat as documentation/report
      return parseGenericMarkdown
    }
  }

  if (lowerFilename.endsWith('.txt')) {
    // Check if it has conversation markers
    const hasConversationMarkers = /^(#{1,3}\s*)?(Human|User|Assistant|AI|Claude|GPT):?\s*$/im.test(content) ||
                                   /^\*\*\s*(Human|User|Assistant|AI):?\s*\*\*\s*$/im.test(content) ||
                                   /^-+\s*(Human|User|Assistant|AI)\s*-+$/im.test(content)

    if (hasConversationMarkers) {
      return parseClaudeMarkdown
    } else {
      // Treat as documentation/report
      return parseGenericMarkdown
    }
  }

  // No format detected
  throw new Error(
    'Unsupported file format. Please upload a ChatGPT or Claude export file (.json, .html, .md, .txt)'
  )
}
