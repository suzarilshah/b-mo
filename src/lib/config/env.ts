/**
 * Environment configuration
 * Centralized access to all environment variables
 */

export const env = {
  // Azure AI Foundry
  azure: {
    embeddings: {
      endpoint: import.meta.env.VITE_AZURE_EMBEDDINGS_ENDPOINT || '',
      apiKey: import.meta.env.VITE_AZURE_EMBEDDINGS_API_KEY || '',
      model: import.meta.env.VITE_AZURE_EMBEDDINGS_MODEL || 'embed-v-4-0',
      dimensions: parseInt(import.meta.env.VITE_AZURE_EMBEDDINGS_DIMENSIONS || '1024'),
    },
    gpt5: {
      endpoint: import.meta.env.VITE_AZURE_GPT5_ENDPOINT || '',
      apiKey: import.meta.env.VITE_AZURE_GPT5_API_KEY || '',
    },
    documentIntelligence: {
      endpoint: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || '',
      key: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY || '',
      region: import.meta.env.VITE_AZURE_DOCUMENT_INTELLIGENCE_REGION || 'eastus',
    },
    openai: {
      endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || '',
      embeddingEndpoint: import.meta.env.VITE_AZURE_OPENAI_EMBEDDING_ENDPOINT || '',
      apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || '',
    },
  },
  // Appwrite
  appwrite: {
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT || '',
    projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID || '',
    apiKey: import.meta.env.VITE_APPWRITE_API_KEY || '',
    bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID || '',
  },
  // Neon DB
  neon: {
    databaseUrl: import.meta.env.VITE_NEON_DATABASE_URL || '',
    apiKey: import.meta.env.VITE_NEON_API_KEY || '',
  },
} as const

// Validation helper
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  if (!env.azure.embeddings.endpoint) missing.push('VITE_AZURE_EMBEDDINGS_ENDPOINT')
  if (!env.azure.embeddings.apiKey) missing.push('VITE_AZURE_EMBEDDINGS_API_KEY')
  if (!env.azure.gpt5.endpoint) missing.push('VITE_AZURE_GPT5_ENDPOINT')
  if (!env.azure.gpt5.apiKey) missing.push('VITE_AZURE_GPT5_API_KEY')
  if (!env.azure.documentIntelligence.endpoint) missing.push('VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT')
  if (!env.azure.documentIntelligence.key) missing.push('VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY')
  if (!env.appwrite.endpoint) missing.push('VITE_APPWRITE_ENDPOINT')
  if (!env.appwrite.projectId) missing.push('VITE_APPWRITE_PROJECT_ID')
  if (!env.appwrite.apiKey) missing.push('VITE_APPWRITE_API_KEY')
  if (!env.appwrite.bucketId) missing.push('VITE_APPWRITE_BUCKET_ID')
  if (!env.neon.databaseUrl) missing.push('VITE_NEON_DATABASE_URL')
  if (!env.neon.apiKey) missing.push('VITE_NEON_API_KEY')

  return {
    valid: missing.length === 0,
    missing,
  }
}

