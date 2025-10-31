import { appwriteFunctions } from './client'

/**
 * Execute an Appwrite function
 */
export async function executeFunction(
  functionId: string,
  data?: string,
  async?: boolean
) {
  return await appwriteFunctions.createExecution(
    functionId,
    data,
    async
  )
}

/**
 * Get function execution status
 */
export async function getExecution(functionId: string, executionId: string) {
  return await appwriteFunctions.getExecution(functionId, executionId)
}

/**
 * List function executions
 */
export async function listExecutions(functionId: string, queries?: string[]) {
  return await appwriteFunctions.listExecutions(functionId, queries)
}

/**
 * Invoke user invitation function (server-side)
 * This should be called from a server-side endpoint
 */
export async function inviteUser(
  _email: string,
  _role: 'admin' | 'auditor' | 'finance_team',
  _companyId: string
) {
  // This will be implemented as an Appwrite Function
  // For now, we'll create a placeholder
  // The actual implementation will be in the Appwrite Functions directory
  throw new Error('User invitation must be handled via Appwrite Function')
}

/**
 * Process document workflow function
 */
export async function processDocumentWorkflow(
  _documentId: string,
  _action: 'approve' | 'reject',
  _userId: string,
  _comments?: string
) {
  // This will be implemented as an Appwrite Function
  throw new Error('Document workflow must be handled via Appwrite Function')
}

/**
 * Process document function interface
 */
export interface ProcessDocumentRequest {
  fileId: string        // Appwrite Storage file ID
  companyId: string
  uploadedBy: string    // Appwrite user ID
  fileName: string
  fileType: string
  fileSize: number
}

/**
 * Process document using Appwrite Function
 * Calls the process-document function to handle OCR, embeddings, and storage
 */
export async function processDocumentFunction(
  data: ProcessDocumentRequest
): Promise<{
  success: boolean
  documentId?: string
  status?: string
  confidence?: number
  message?: string
  error?: string
}> {
  try {
    // Function ID matches the deployed function
    const FUNCTION_ID = 'process-document'
    
    // Call Appwrite Function execution (async execution)
    // Note: We use async=true to avoid timeout issues
    const execution = await appwriteFunctions.createExecution(
      FUNCTION_ID,
      JSON.stringify(data),
      true // Async execution - required for long-running operations
    )

    // Poll for completion (with extended timeout for document processing)
    const maxWaitTime = 120000 // 120 seconds (2 minutes) - document processing can take time
    const pollInterval = 3000 // 3 seconds between polls
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      const status: any = await appwriteFunctions.getExecution(
        FUNCTION_ID,
        execution.$id
      )

      // Debug logging (only in development)
      if (import.meta.env.DEV) {
        console.log('Execution status:', status)
      }

      if (status.status === 'completed') {
        // Parse response
        if (status.responseStatusCode === 200) {
          try {
            // Try different possible response fields
            const responseBody = status.responseBody || status.response || status.responseBodyRaw || status.body
            let result: any
            
            if (typeof responseBody === 'string') {
              try {
                result = JSON.parse(responseBody)
              } catch (e) {
                // If it's not JSON, treat as plain text
                result = { success: true, message: responseBody }
              }
            } else if (responseBody) {
              result = responseBody
            } else {
              // No response body, check if there's data elsewhere
              result = status
            }
            
            return result
          } catch (e) {
            console.error('Failed to parse function response:', e, status)
            return {
              success: false,
              error: `Failed to parse function response: ${e instanceof Error ? e.message : String(e)}`,
            }
          }
        } else {
          // Extract error details from response - try multiple possible fields
          const errorBody = status.responseBody || status.stderr || status.response || status.responseBodyRaw || status.body || status.error
          let errorMsg = 'Unknown error'
          
          if (errorBody) {
            if (typeof errorBody === 'string') {
              try {
                const parsed = JSON.parse(errorBody)
                errorMsg = parsed.error || parsed.message || errorBody
              } catch {
                errorMsg = errorBody
              }
            } else if (typeof errorBody === 'object') {
              errorMsg = errorBody.error || errorBody.message || JSON.stringify(errorBody)
            } else {
              errorMsg = String(errorBody)
            }
          } else {
            errorMsg = `Function returned status code ${status.responseStatusCode || 'unknown'}`
          }
          
          console.error('Function execution failed:', status)
          return {
            success: false,
            error: `Function execution failed: ${errorMsg}`,
          }
        }
      }

      if (status.status === 'failed') {
        // Extract error details - try multiple possible fields
        const errorBody = status.stderr || status.responseBody || status.response || status.responseBodyRaw || status.body || status.error
        let errorMsg = 'Function execution failed'
        
        if (errorBody) {
          if (typeof errorBody === 'string') {
            try {
              const parsed = JSON.parse(errorBody)
              errorMsg = parsed.error || parsed.message || errorBody
            } catch {
              errorMsg = errorBody
            }
          } else if (typeof errorBody === 'object') {
            errorMsg = errorBody.error || errorBody.message || JSON.stringify(errorBody)
          } else {
            errorMsg = String(errorBody)
          }
        } else {
          // Try to get error from status object itself
          errorMsg = status.error || status.message || JSON.stringify(status)
        }
        
        console.error('Function execution failed:', status)
        return {
          success: false,
          error: `Function execution failed: ${errorMsg}`,
        }
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    // Timeout
    return {
      success: false,
      error: 'Function execution timeout - document processing is taking longer than expected. Please check the function logs.',
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to execute document processing function',
    }
  }
}

