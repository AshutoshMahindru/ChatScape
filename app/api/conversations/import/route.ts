import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { ParsedConversation } from '@/lib/parsers/types'

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const conversation: ParsedConversation = body.conversation
    const originalFilename: string = body.originalFilename || 'unknown'

    // Validate required fields
    if (
      !conversation ||
      !conversation.title ||
      !conversation.messages ||
      !Array.isArray(conversation.messages) ||
      conversation.messages.length === 0 ||
      !conversation.sourcePlatform ||
      !conversation.sourceFormat
    ) {
      return NextResponse.json(
        { error: 'Invalid conversation data' },
        { status: 400 }
      )
    }

    // Insert conversation record
    const { data: conversationRecord, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: conversation.title,
        source_platform: conversation.sourcePlatform,
        source_format: conversation.sourceFormat,
        original_filename: originalFilename,
        message_count: conversation.messages.length,
        first_message_at: conversation.firstMessageAt?.toISOString(),
        last_message_at: conversation.lastMessageAt?.toISOString(),
      })
      .select('id')
      .single()

    if (conversationError || !conversationRecord) {
      console.error('Error inserting conversation:', conversationError)
      return NextResponse.json(
        { error: 'Failed to save conversation' },
        { status: 500 }
      )
    }

    // Prepare messages for batch insert
    const messagesToInsert = conversation.messages.map((message, index) => ({
      conversation_id: conversationRecord.id,
      role: message.role,
      content: message.content,
      message_index: index,
      timestamp: message.timestamp?.toISOString(),
    }))

    // Batch insert messages
    const { error: messagesError } = await supabase
      .from('messages')
      .insert(messagesToInsert)

    if (messagesError) {
      console.error('Error inserting messages:', messagesError)
      // Try to clean up the conversation record
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationRecord.id)

      return NextResponse.json(
        { error: 'Failed to save messages' },
        { status: 500 }
      )
    }

    // Return success
    return NextResponse.json({
      conversationId: conversationRecord.id,
      messageCount: conversation.messages.length,
    })
  } catch (error) {
    console.error('Error importing conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
