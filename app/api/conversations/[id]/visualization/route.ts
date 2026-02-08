import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { VisualizationData, VisualizationNode, VisualizationEdge } from '@/lib/visualization/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const conversationId = params.id

    // Fetch conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, title, message_count')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (conversationError) {
      if (conversationError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching conversation:', conversationError)
      return NextResponse.json(
        { error: 'Failed to fetch conversation' },
        { status: 500 }
      )
    }

    // Fetch messages with topics
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, content, timestamp, message_index, topic, topic_generated_at')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages found for visualization' },
        { status: 404 }
      )
    }

    // Transform messages into visualization nodes
    const nodes: VisualizationNode[] = messages.map((msg) => ({
      id: msg.id,
      topic: msg.topic || msg.content.slice(0, 30) + '...', // Fallback to truncated content
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
      message_index: msg.message_index,
    }))

    // Generate edges connecting sequential messages
    const edges: VisualizationEdge[] = []
    for (let i = 0; i < messages.length - 1; i++) {
      edges.push({
        source: messages[i].id,
        target: messages[i + 1].id,
      })
    }

    const response: VisualizationData = {
      conversation: {
        id: conversation.id,
        title: conversation.title,
        message_count: conversation.message_count,
      },
      nodes,
      edges,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in visualization endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
