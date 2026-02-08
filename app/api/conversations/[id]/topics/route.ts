import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { TopicsListResponse } from '@/lib/visualization/types'

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

    // Verify conversation belongs to user
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Fetch messages with topics and group by topic
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('topic')
      .eq('conversation_id', conversationId)
      .not('topic', 'is', null)

    if (messagesError) {
      console.error('Error fetching topics:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      )
    }

    // Count occurrences of each topic
    const topicCounts = new Map<string, number>()
    messages?.forEach((msg) => {
      if (msg.topic) {
        topicCounts.set(msg.topic, (topicCounts.get(msg.topic) || 0) + 1)
      }
    })

    // Convert to array and sort by count (descending)
    const topics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)

    const response: TopicsListResponse = {
      topics,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in topics endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
