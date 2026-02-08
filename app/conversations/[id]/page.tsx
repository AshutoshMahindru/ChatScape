import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MindMapVisualization } from '@/components/visualization'

export default async function ConversationVisualizationPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to signin
  if (!user) {
    redirect('/signin')
  }

  // Verify conversation exists and belongs to user
  const { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  // If conversation not found, redirect to dashboard
  if (error || !conversation) {
    redirect('/dashboard')
  }

  return <MindMapVisualization conversationId={params.id} />
}
