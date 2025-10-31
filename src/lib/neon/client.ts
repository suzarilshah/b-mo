import { neon, NeonQueryFunction } from '@neondatabase/serverless'
import { env } from '../config/env'

// Initialize Neon client
let sql: NeonQueryFunction<false, false> | null = null

export function getNeonClient(): NeonQueryFunction<false, false> {
  if (!sql) {
    if (!env.neon.databaseUrl) {
      throw new Error('Neon database URL is not configured')
    }
    sql = neon(env.neon.databaseUrl)
  }
  return sql
}

/**
 * Execute a SQL query with error handling
 */
export async function query<T = any>(
  queryString: string,
  params?: any[]
): Promise<T[]> {
  const client = getNeonClient()
  
  try {
    const result = await client(queryString, params)
    return result as T[]
  } catch (error) {
    console.error('Neon DB query error:', error)
    throw error
  }
}

/**
 * Enable pgvector extension (run once during setup)
 */
export async function enablePgVector(): Promise<void> {
  await query('CREATE EXTENSION IF NOT EXISTS vector')
}

