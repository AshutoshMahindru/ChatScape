import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
      <div className="max-w-4xl mx-auto text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
            LlmChatMap
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 font-medium">
            Transform your LLM chat histories into interactive mind maps
          </p>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Stop scrolling through endless chat histories. See your conversations
            as a visual map and jump directly to what you need.
          </p>
        </div>

        {/* CTA Button */}
        <div>
          <Link
            href="/signup"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200"
          >
            Get Started
          </Link>
        </div>

        {/* Benefits Section */}
        <div className="pt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Key Benefits
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="space-y-2">
              <div className="text-4xl">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-900">
                Visual Navigation
              </h3>
              <p className="text-gray-600">
                Navigate your chat histories visually with interactive mind maps
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900">
                Quick Search & Filtering
              </h3>
              <p className="text-gray-600">
                Find exactly what you're looking for with powerful search tools
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900">
                Jump to Conversations
              </h3>
              <p className="text-gray-600">
                Access any conversation directly without endless scrolling
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
