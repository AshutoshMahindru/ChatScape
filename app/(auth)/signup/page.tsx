import SignUpForm from '@/components/auth/SignUpForm'

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-2 text-gray-600">Get started with LlmChatMap</p>
        </div>
        <SignUpForm />
      </div>
    </main>
  )
}
