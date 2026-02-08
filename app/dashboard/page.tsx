import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/auth/SignOutButton'
import ImportFlow from '@/components/upload/ImportFlow'

export default async function DashboardPage() {
  const supabase = createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to signin (middleware should catch this, but double-check)
  if (!user) {
    redirect('/signin')
  }

  // Fetch user profile from database to prove connectivity
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {profile?.email || user.email}
              </h1>
              <p className="text-gray-600">Your LlmChatMap Dashboard</p>
            </div>
            <SignOutButton />
          </div>
        </div>

        {/* Import Flow */}
        <ImportFlow />
      </div>
    </main>
  )
}
