import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Message {
  id: string
  content: string
}

async function generateTopicForMessage(
  content: string,
  retries = 3
): Promise<string> {
  const prompt = `Summarize this message in 3-5 words as a topic label. Be specific and descriptive.

Message: "${content.slice(0, 500)}"

Topic:`

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 20,
        temperature: 0.3,
      })

      const topic = response.choices[0]?.message?.content?.trim()
      if (topic) {
        return topic
      }
    } catch (error: any) {
      // Handle rate limiting
      if (error?.status === 429 && attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Log error and continue
      console.error(`Error generating topic (attempt ${attempt + 1}):`, error)
      if (attempt === retries - 1) {
        return '[Topic unavailable]'
      }
    }
  }

  return '[Topic unavailable]'
}

async function processBatch(
  messages: Message[],
  supabase: any
): Promise<number> {
  const promises = messages.map(async (msg) => {
    const topic = await generateTopicForMessage(msg.content)

    // Update message with generated topic
    await supabase
      .from('messages')
      .update({
        topic,
        topic_generated_at: new Date().toISOString(),
      })
      .eq('id', msg.id)

    return topic
  })

  await Promise.all(promises)
  return messages.length
}

export async function POST(
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

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Parse request body (optional message_ids filter)
    const body = await request.json().catch(() => ({}))
    const messageIds = body.message_ids

    // Fetch messages without topics
    let query = supabase
      .from('messages')
      .select('id, content')
      .eq('conversation_id', conversationId)
      .is('topic', null)
      .order('message_index', { ascending: true })
      .limit(100) // Max 100 messages per request

    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      query = query.in('id', messageIds)
    }

    const { data: messages, error: messagesError } = await query

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        topics_generated: 0,
        message: 'No messages need topic generation',
      })
    }

    const total = messages.length
    let processed = 0

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Process messages in batches of 10
          const batchSize = 10
          for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize)
            const batchProcessed = await processBatch(batch, supabase)
            processed += batchProcessed

            // Send progress update
            const progressData = JSON.stringify({
              type: 'progress',
              current: processed,
              total,
            })
            controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
          }

          // Send completion message
          const completeData = JSON.stringify({
            type: 'complete',
            topics_generated: processed,
          })
          controller.enqueue(encoder.encode(`data: ${completeData}\n\n`))

          controller.close()
        } catch (error) {
          console.error('Error in SSE stream:', error)
          const errorData = JSON.stringify({
            type: 'error',
            error: 'Failed to generate topics',
          })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in generate-topics endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
