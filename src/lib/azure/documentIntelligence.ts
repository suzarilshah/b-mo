import { env } from '../config/env'
import { retryWithBackoff, parseAzureError, isRetryableError } from './utils'

/**
 * Analyze a document (invoice/receipt) using Azure Document Intelligence REST API
 */
export async function analyzeDocument(file: File | Blob): Promise<{
  confidence: number
  data: Record<string, any>
  extractedFields: Record<string, any>
}> {
  return retryWithBackoff(async () => {
  // Convert file to base64 for API call
  const arrayBuffer = await file.arrayBuffer()
  // Convert ArrayBuffer to base64 in browser
  const bytes = new Uint8Array(arrayBuffer)
  const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
  const base64Data = btoa(binary)
  
    const endpoint = `${env.azure.documentIntelligence.endpoint}formrecognizer/documentModels/prebuilt-invoice:analyze?api-version=2024-02-29-preview`
    
    // Start analysis
    const analyzeResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': env.azure.documentIntelligence.key,
      },
      body: JSON.stringify({
        base64Source: base64Data,
      }),
    })
    
    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text()
      const error = new Error(`Document Intelligence API error: ${errorText}`)
      ;(error as any).status = analyzeResponse.status
      
      if (!isRetryableError({ status: analyzeResponse.status })) {
        throw new Error(parseAzureError(errorText))
      }
      throw error
    }
  
    // Get operation location
    const operationLocation = analyzeResponse.headers.get('Operation-Location')
    if (!operationLocation) {
      throw new Error('No operation location in response')
    }
    
    // Poll for results
    let result: any = null
    let attempts = 0
    const maxAttempts = 30
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': env.azure.documentIntelligence.key,
        },
      })
      
      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        throw new Error(`Document Intelligence polling error: ${errorText}`)
      }
      
      result = await statusResponse.json()
      
      if (result.status === 'succeeded') {
        break
      }
      
      if (result.status === 'failed') {
        throw new Error(`Analysis failed: ${result.error?.message || 'Unknown error'}`)
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Analysis timeout')
    }
    
    // Extract confidence scores and fields
    let minConfidence = 1.0
    const extractedFields: Record<string, any> = {}
    
    if (result.analyzeResult?.documents && result.analyzeResult.documents.length > 0) {
      const document = result.analyzeResult.documents[0]
      
      // Extract all fields with their confidence scores
      if (document.fields) {
        for (const [fieldName, fieldValue] of Object.entries(document.fields)) {
          const field = fieldValue as any
          const confidence = field.confidence || 1.0
          minConfidence = Math.min(minConfidence, confidence)
          
          extractedFields[fieldName] = {
            value: field.content || field.value || field.contentArray,
            confidence,
          }
        }
      }
    }
    
    return {
      confidence: minConfidence,
      data: result,
      extractedFields,
    }
  }, { maxRetries: 2, retryDelay: 2000 }) // Longer delay for document processing
}

