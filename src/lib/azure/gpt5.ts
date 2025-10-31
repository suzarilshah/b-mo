import { env } from '../config/env'
import { retryWithBackoff, parseAzureError, isRetryableError } from './utils'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Call GPT-5 via Azure AI Foundry
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }
): Promise<string> {
  return retryWithBackoff(async () => {
    const response = await fetch(env.azure.gpt5.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.azure.gpt5.apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
        stream: options?.stream ?? false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(`GPT-5 API error: ${errorText}`)
      ;(error as any).status = response.status
      
      if (!isRetryableError({ status: response.status })) {
        throw new Error(parseAzureError(errorText))
      }
      throw error
    }

    const data = await response.json()
    
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content
    }
    
    throw new Error('Unexpected GPT-5 response format')
  }, { maxRetries: 3 })
}

/**
 * Stream chat completion for real-time responses
 */
export async function* chatCompletionStream(
  messages: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(env.azure.gpt5.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.azure.gpt5.apiKey,
    },
    body: JSON.stringify({
      messages,
      temperature: 0.7,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GPT-5 API error: ${error}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('Failed to get response stream')
  }

  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          return
        }
        
        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
    }
  }
}

