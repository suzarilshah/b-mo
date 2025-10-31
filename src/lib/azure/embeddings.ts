import { env } from '../config/env'
import { retryWithBackoff, parseAzureError, isRetryableError } from './utils'

/**
 * Generate embeddings using Azure AI Foundry embed-v-4-0 model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  return retryWithBackoff(async () => {
    const response = await fetch(env.azure.embeddings.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': env.azure.embeddings.apiKey,
      },
      body: JSON.stringify({
        input: text,
        model: env.azure.embeddings.model,
        dimensions: env.azure.embeddings.dimensions,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = new Error(`Failed to generate embedding: ${errorText}`)
      ;(error as any).status = response.status
      
      if (isRetryableError({ status: response.status })) {
        throw error
      }
      throw new Error(parseAzureError(errorText))
    }

    const data = await response.json()
    
    // Handle different response formats
    if (data.data && Array.isArray(data.data) && data.data[0]?.embedding) {
      return data.data[0].embedding
    }
    
    if (Array.isArray(data)) {
      return data[0]?.embedding || data[0]
    }
    
    if (data.embedding) {
      return data.embedding
    }
    
    throw new Error('Unexpected embedding response format')
  }, { maxRetries: 3 })
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = await Promise.all(
    texts.map(text => generateEmbedding(text))
  )
  return embeddings
}

