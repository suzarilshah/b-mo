/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_EMBEDDINGS_ENDPOINT: string
  readonly VITE_AZURE_EMBEDDINGS_API_KEY: string
  readonly VITE_AZURE_EMBEDDINGS_MODEL: string
  readonly VITE_AZURE_EMBEDDINGS_DIMENSIONS: string
  readonly VITE_AZURE_GPT5_ENDPOINT: string
  readonly VITE_AZURE_GPT5_API_KEY: string
  readonly VITE_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: string
  readonly VITE_AZURE_DOCUMENT_INTELLIGENCE_KEY: string
  readonly VITE_AZURE_DOCUMENT_INTELLIGENCE_REGION: string
  readonly VITE_AZURE_OPENAI_ENDPOINT: string
  readonly VITE_AZURE_OPENAI_EMBEDDING_ENDPOINT: string
  readonly VITE_AZURE_OPENAI_API_KEY: string
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_API_KEY: string
  readonly VITE_APPWRITE_BUCKET_ID: string
  readonly VITE_NEON_DATABASE_URL: string
  readonly VITE_NEON_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

