import { useState, useRef, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { chatCompletionStream, chatCompletion } from '@/lib/azure/gpt5'
import { searchDocuments, searchTransactions, getAccountInfo, buildRAGContext } from '@/lib/rag/search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function ChatInterface() {
  const { company } = useCompany()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m B-mo, your AI accounting assistant. Ask me about your financial data, transactions, documents, or accounts.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !company || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Step 1: Search for relevant context using RAG
      const [documents, transactions, accounts] = await Promise.all([
        searchDocuments(company.id, input, 3),
        searchTransactions(company.id, input, 5),
        getAccountInfo(company.id),
      ])

      // Step 2: Build context string
      const context = buildRAGContext(documents, transactions, accounts)

      // Step 3: Build messages with context
      const systemMessage = `You are B-mo, an AI accounting assistant. You help users understand their financial data, transactions, documents, and accounts.

Context from the database:
${context}

Answer questions based on this context. If the information isn't available in the context, say so. Be concise and helpful.`

      const conversationMessages = [
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        userMessage,
      ]

      // Step 4: Get AI response with streaming
      let assistantMessage = ''
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ])

      try {
        // Try streaming first
        const streamGenerator = chatCompletionStream([
          { role: 'system', content: systemMessage },
          ...conversationMessages.slice(-5), // Last 5 messages for context
        ])

        for await (const chunk of streamGenerator) {
          assistantMessage += chunk
          setMessages(prev => {
            const newMessages = [...prev]
            if (newMessages[newMessages.length - 1].role === 'assistant') {
              newMessages[newMessages.length - 1].content = assistantMessage
            }
            return newMessages
          })
        }
      } catch (error) {
        // Fallback to non-streaming
        console.error('Streaming failed, using regular completion:', error)
        assistantMessage = await chatCompletion([
          { role: 'system', content: systemMessage },
          ...conversationMessages.slice(-5),
        ])

        setMessages(prev => {
          const newMessages = [...prev]
          if (newMessages[newMessages.length - 1].role === 'assistant') {
            newMessages[newMessages.length - 1].content = assistantMessage
          }
          return newMessages
        })
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!company) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center text-gray-500">
          Please select a company to use the chat feature.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle>AI Assistant Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about your finances..."
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

