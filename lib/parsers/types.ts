export interface ParsedConversation {
  title: string
  messages: ParsedMessage[]
  firstMessageAt?: Date
  lastMessageAt?: Date
  sourcePlatform: 'chatgpt' | 'claude' | 'generic'
  sourceFormat: 'json' | 'html' | 'markdown'
}

export interface ParsedMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export type Parser = (fileContent: string) => ParsedConversation
