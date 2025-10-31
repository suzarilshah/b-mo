/**
 * Utility functions for Azure service integrations
 */

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  backoffMultiplier?: number
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options }
  let lastError: Error | null = null
  let delay = opts.retryDelay

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on client errors (4xx)
      if (error instanceof Error && 'status' in error) {
        const status = (error as any).status
        if (status >= 400 && status < 500) {
          throw error
        }
      }

      // Don't retry on last attempt
      if (attempt < opts.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay))
        delay *= opts.backoffMultiplier
      }
    }
  }

  throw lastError || new Error('Retry failed')
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  // HTTP status codes that are retryable
  if (error.status) {
    const status = error.status
    // 5xx server errors
    if (status >= 500 && status < 600) {
      return true
    }
    // 429 rate limit
    if (status === 429) {
      return true
    }
    // 408 timeout
    if (status === 408) {
      return true
    }
  }

  return false
}

/**
 * Parse Azure API error response
 */
export function parseAzureError(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.message) {
    return error.message
  }

  if (error?.error?.message) {
    return error.error.message
  }

  if (error?.response) {
    try {
      const parsed = JSON.parse(error.response)
      if (parsed.error?.message) {
        return parsed.error.message
      }
    } catch {
      // Not JSON
    }
  }

  return 'Unknown Azure API error'
}

