import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ChatInterface } from '@/components/chat/ChatInterface'

export const Route = createFileRoute('/chat')({
  component: ChatPage,
})

function ChatPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">AI Assistant</h1>
          <ChatInterface />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}


