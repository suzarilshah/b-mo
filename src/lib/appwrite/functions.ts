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
        // Appwrite Execution object may have: stderr, responseBody, response, responseBodyRaw, body, error
        // Also check for nested error objects
        let errorBody = status.stderr || status.responseBody || status.response || status.responseBodyRaw || status.body || status.error
        
        // If responseBody is empty string but content-length exists, try to get it from response
        if (!errorBody && status.responseHeaders) {
          const contentTypeHeader = status.responseHeaders.find((h: any) => h.name === 'content-type')
          if (contentTypeHeader && contentTypeHeader.value.includes('application/json')) {
            // Try to extract from responseBodyRaw if available
            errorBody = status.responseBodyRaw || status.body
          }
        }
        
        let errorMsg = 'Function execution failed'
        
        if (errorBody) {
          if (typeof errorBody === 'string') {
            try {
              const parsed = JSON.parse(errorBody)
              errorMsg = parsed.error || parsed.message || parsed.details || errorBody
            } catch {
              errorMsg = errorBody
            }
          } else if (typeof errorBody === 'object') {
            errorMsg = errorBody.error || errorBody.message || errorBody.details || JSON.stringify(errorBody)
          } else {
            errorMsg = String(errorBody)
          }
        } else {
          // Enhanced error extraction - try to get responseBody from the actual HTTP response
          // Sometimes Appwrite wraps the response
          if (status.responseStatusCode === 500) {
            // Try to extract from any available field
            const allFields = Object.keys(status)
            const possibleErrorFields = allFields.filter(k => 
              k.toLowerCase().includes('error') || 
              k.toLowerCase().includes('message') || 
              k.toLowerCase().includes('fail') ||
              k.toLowerCase().includes('body') ||
              k.toLowerCase().includes('response')
            )
            
            // Try to get actual error from nested objects
            let foundError = null
            for (const key of possibleErrorFields) {
              const value = (status as any)[key]
              if (value && typeof value === 'object') {
                const nestedError = value.error || value.message || value.details
                if (nestedError) {
                  foundError = nestedError
                  break
                }
              } else if (value && typeof value === 'string' && value.length > 0) {
                foundError = value
                break
              }
            }
            
            if (foundError) {
              errorMsg = foundError
            } else {
              // Last resort: include full status for debugging
              errorMsg = `Function execution failed with status 500. Response length: ${status.responseHeaders?.find((h: any) => h.name === 'content-length')?.value || 'unknown'} bytes. Full status: ${JSON.stringify(status, null, 2)}`
            }
          } else {
            errorMsg = `Function execution failed. Status code: ${status.responseStatusCode || 'unknown'}. Full status: ${JSON.stringify(status, null, 2)}`
          }
        }
        
        console.error('Function execution failed. Full status:', JSON.stringify(status, null, 2))
        return {
          success: false,
          error: errorMsg,
        }
      }

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
    
    console.log('[Function] Creating execution with data:', data)
    
    // Call Appwrite Function execution (async execution)
    // Note: We use async=true to avoid timeout issues
    const execution = await appwriteFunctions.createExecution(
      FUNCTION_ID,
      JSON.stringify(data),
      true // Async execution - required for long-running operations
    )

    console.log('[Function] Execution created:', execution.$id, 'Status:', execution.status)

    // Poll for completion (with extended timeout for document processing)
    const maxWaitTime = 120000 // 120 seconds (2 minutes) - document processing can take time
    const pollInterval = 3000 // 3 seconds between polls
    const startTime = Date.now()
    let lastStatus = execution.status
    let consecutiveWaitingCount = 0

    while (Date.now() - startTime < maxWaitTime) {
      const status: any = await appwriteFunctions.getExecution(
        FUNCTION_ID,
        execution.$id
      )

      // Debug logging (always log in development, log status changes in production)
      const statusChanged = status.status !== lastStatus
      if (import.meta.env.DEV || statusChanged) {
        console.log(`[Function] Execution status: ${status.status} (${Date.now() - startTime}ms elapsed)`, {
          status: status.status,
          responseStatusCode: status.responseStatusCode,
          duration: status.duration,
          logs: status.logs ? status.logs.substring(0, 200) : '(no logs)',
          errors: status.errors ? status.errors.substring(0, 200) : '(no errors)'
        })
      }
      lastStatus = status.status

      // Handle different execution statuses
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
        // Appwrite Execution object may have: stderr, responseBody, response, responseBodyRaw, body, error
        // Also check for nested error objects
        let errorBody = status.stderr || status.responseBody || status.response || status.responseBodyRaw || status.body || status.error
        
        // If responseBody is empty string but content-length exists, try to get it from response
        if (!errorBody && status.responseHeaders) {
          const contentTypeHeader = status.responseHeaders.find((h: any) => h.name === 'content-type')
          if (contentTypeHeader && contentTypeHeader.value.includes('application/json')) {
            // Try to extract from responseBodyRaw if available
            errorBody = status.responseBodyRaw || status.body
          }
        }
        
        let errorMsg = 'Function execution failed'
        
        if (errorBody) {
          if (typeof errorBody === 'string') {
            try {
              const parsed = JSON.parse(errorBody)
              errorMsg = parsed.error || parsed.message || parsed.details || errorBody
            } catch {
              errorMsg = errorBody
            }
          } else if (typeof errorBody === 'object') {
            errorMsg = errorBody.error || errorBody.message || errorBody.details || JSON.stringify(errorBody)
          } else {
            errorMsg = String(errorBody)
          }
        } else {
          // Enhanced error extraction - try to get responseBody from the actual HTTP response
          // Sometimes Appwrite wraps the response
          if (status.responseStatusCode === 500) {
            // Try to extract from any available field
            const allFields = Object.keys(status)
            const possibleErrorFields = allFields.filter(k => 
              k.toLowerCase().includes('error') || 
              k.toLowerCase().includes('message') || 
              k.toLowerCase().includes('fail') ||
              k.toLowerCase().includes('body') ||
              k.toLowerCase().includes('response')
            )
            
            // Try to get actual error from nested objects
            let foundError = null
            for (const key of possibleErrorFields) {
              const value = (status as any)[key]
              if (value && typeof value === 'object') {
                const nestedError = value.error || value.message || value.details
                if (nestedError) {
                  foundError = nestedError
                  break
                }
              } else if (value && typeof value === 'string' && value.length > 0) {
                foundError = value
                break
              }
            }
            
            if (foundError) {
              errorMsg = foundError
            } else {
              // Last resort: include full status for debugging
              errorMsg = `Function execution failed with status 500. Response length: ${status.responseHeaders?.find((h: any) => h.name === 'content-length')?.value || 'unknown'} bytes. Full status: ${JSON.stringify(status, null, 2)}`
            }
          } else {
            errorMsg = `Function execution failed. Status code: ${status.responseStatusCode || 'unknown'}. Full status: ${JSON.stringify(status, null, 2)}`
          }
        }
        
        console.error('Function execution failed. Full status:', JSON.stringify(status, null, 2))
        return {
          success: false,
          error: errorMsg,
        }
      }

      // Handle "waiting" status - function is queued but not started
      if (status.status === 'waiting') {
        consecutiveWaitingCount++
        // If stuck in waiting for more than 30 seconds, something is wrong
        if (consecutiveWaitingCount > 10) {
          return {
            success: false,
            error: `Function execution is stuck in 'waiting' status. The function may not be properly deployed or there may be a queue issue. Execution ID: ${execution.$id}`,
          }
        }
      } else {
        consecutiveWaitingCount = 0 // Reset counter when status changes
      }

      // Handle "processing" status - function is running
      if (status.status === 'processing') {
        // Continue polling - function is running
        consecutiveWaitingCount = 0
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    // Timeout - get final status for debugging
    const finalStatus = await appwriteFunctions.getExecution(FUNCTION_ID, execution.$id)
    console.error('Function execution timeout. Final status:', JSON.stringify(finalStatus, null, 2))
    
    return {
      success: false,
      error: `Function execution timeout after ${maxWaitTime/1000} seconds. Final status: ${finalStatus.status}. Please check the function logs in Appwrite Console. Execution ID: ${execution.$id}`,
    }
  } catch (err: any) {
    console.error('Error executing function:', err)
    return {
      success: false,
      error: err.message || 'Failed to execute document processing function',
    }
  }
}

