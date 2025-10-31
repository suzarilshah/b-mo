/**
 * Appwrite Function: Process Document
 * 
 * This function handles document processing pipeline:
 * 1. Downloads file from Appwrite Storage
 * 2. Analyzes with Azure Document Intelligence (OCR)
 * 3. Generates embeddings using Azure Embeddings API
 * 4. Stores document metadata and embeddings in NeonDB
 * 
 * Requires environment variables:
 * - APPWRITE_ENDPOINT
 * - APPWRITE_PROJECT_ID
 * - APPWRITE_API_KEY
 * - APPWRITE_BUCKET_ID
 * - AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
 * - AZURE_DOCUMENT_INTELLIGENCE_KEY
 * - AZURE_EMBEDDINGS_ENDPOINT
 * - AZURE_EMBEDDINGS_API_KEY
 * - AZURE_EMBEDDINGS_MODEL (e.g., "embed-v-4-0")
 * - AZURE_EMBEDDINGS_DIMENSIONS (e.g., 1536)
 * - NEON_DATABASE_URL
 */

import { Client, Storage } from 'appwrite'
import { neon } from '@neondatabase/serverless'

interface ProcessDocumentRequest {
  fileId: string        // Appwrite Storage file ID
  companyId: string
  uploadedBy: string    // Appwrite user ID
  fileName: string
  fileType: string
  fileSize: number
}

export default async function(context: any) {
  const { req, res, log, error } = context
  
  // Set execution start time for monitoring
  const startTime = Date.now()
  
  try {
    // Parse request
    const data: ProcessDocumentRequest = JSON.parse(req.bodyRaw || '{}')
    const { fileId, companyId, uploadedBy, fileName, fileType, fileSize } = data

    // Validate input
    if (!fileId || !companyId || !uploadedBy || !fileName) {
      return res.json({
        success: false,
        error: 'Missing required fields: fileId, companyId, uploadedBy, fileName',
      }, 400)
    }

    log(`Processing document: ${fileName} for company ${companyId} (started at ${new Date().toISOString()})`)

    // Initialize Appwrite admin client
    const appwriteClient = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!)

    const storage = new Storage(appwriteClient)

    // 1. Download file from Appwrite Storage
    log(`[${Date.now() - startTime}ms] Downloading file from Appwrite Storage...`)
    const fileBuffer = await storage.getFileDownload(
      process.env.APPWRITE_BUCKET_ID!,
      fileId
    )
    
    // Convert Response to Buffer/ArrayBuffer for Azure API
    const arrayBuffer = await fileBuffer.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '')
    const base64Data = Buffer.from(binary, 'binary').toString('base64')
    
    log(`[${Date.now() - startTime}ms] File downloaded and converted (size: ${base64Data.length} bytes)`)

    // 2. Analyze with Azure Document Intelligence
    log(`[${Date.now() - startTime}ms] Starting Azure Document Intelligence analysis...`)
    const docIntelligenceEndpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT!
    const docIntelligenceKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY!
    
    const analyzeEndpoint = `${docIntelligenceEndpoint}formrecognizer/documentModels/prebuilt-invoice:analyze?api-version=2024-02-29-preview`
    
    const analyzeResponse = await fetch(analyzeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': docIntelligenceKey,
      },
      body: JSON.stringify({
        base64Source: base64Data,
      }),
    })

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text()
      throw new Error(`Document Intelligence API error: ${errorText}`)
    }

    // Get operation location
    const operationLocation = analyzeResponse.headers.get('Operation-Location')
    if (!operationLocation) {
      throw new Error('No operation location in response')
    }

    log(`[${Date.now() - startTime}ms] Analysis request submitted, polling for results...`)

    // Poll for results (optimized polling with exponential backoff)
    let ocrResult: any = null
    let attempts = 0
    const maxAttempts = 20 // Reduced from 30
    let pollDelay = 500 // Start with 500ms, increase gradually

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': docIntelligenceKey,
        },
      })

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        throw new Error(`Document Intelligence polling error: ${errorText}`)
      }

      ocrResult = await statusResponse.json()

      if (ocrResult.status === 'succeeded') {
        break
      }

      if (ocrResult.status === 'failed') {
        throw new Error(`Analysis failed: ${ocrResult.error?.message || 'Unknown error'}`)
      }

      // Exponential backoff: 500ms, 750ms, 1000ms, 1500ms...
      await new Promise(resolve => setTimeout(resolve, pollDelay))
      pollDelay = Math.min(pollDelay * 1.5, 2000) // Cap at 2 seconds
      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error('Analysis timeout')
    }

    // Extract confidence scores and fields
    let minConfidence = 1.0
    const extractedFields: Record<string, any> = {}

    if (ocrResult.analyzeResult?.documents && ocrResult.analyzeResult.documents.length > 0) {
      const document = ocrResult.analyzeResult.documents[0]

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

    log(`[${Date.now() - startTime}ms] OCR completed. Confidence: ${minConfidence.toFixed(2)}`)

    // 3. Get uploaded_by user ID from NeonDB
    log(`[${Date.now() - startTime}ms] Looking up user in NeonDB...`)
    const sql = neon(process.env.NEON_DATABASE_URL!)
    
    const userResult = await sql`
      SELECT id FROM users WHERE appwrite_user_id = ${uploadedBy} LIMIT 1
    `
    
    if (!userResult || userResult.length === 0) {
      throw new Error(`User not found in database: ${uploadedBy}`)
    }
    
    const uploadedByUserId = userResult[0].id

    // 4. Create document record in NeonDB
    log(`[${Date.now() - startTime}ms] Creating document record in NeonDB...`)
    const documentId = crypto.randomUUID()
    const status = minConfidence < 0.5 ? 'review' : 'processing'
    const requiresReview = minConfidence < 0.5

    await sql`
      INSERT INTO documents (
        id, company_id, appwrite_file_id, file_name, file_type, file_size,
        document_type, ocr_confidence, ocr_data, extracted_data,
        status, requires_review, uploaded_by
      ) VALUES (
        ${documentId},
        ${companyId},
        ${fileId},
        ${fileName},
        ${fileType || null},
        ${fileSize},
        'invoice',
        ${minConfidence},
        ${JSON.stringify(ocrResult)}::jsonb,
        ${JSON.stringify(extractedFields)}::jsonb,
        ${status},
        ${requiresReview},
        ${uploadedByUserId}
      )
    `

    log(`[${Date.now() - startTime}ms] Document record created: ${documentId}`)

    // 5. Generate embeddings if confidence is high enough
    if (minConfidence >= 0.5) {
      log(`[${Date.now() - startTime}ms] Generating embeddings...`)
      
      // Extract text from document fields for embedding
      const textChunks: string[] = []
      for (const [key, value] of Object.entries(extractedFields)) {
        if (value?.value && typeof value.value === 'string') {
          textChunks.push(`${key}: ${value.value}`)
        }
      }
      
      const combinedText = textChunks.join(' | ')
      
      if (combinedText.length > 0) {
        try {
          // Generate embedding using Azure Embeddings API
          const embeddingsEndpoint = process.env.AZURE_EMBEDDINGS_ENDPOINT!
          const embeddingsKey = process.env.AZURE_EMBEDDINGS_API_KEY!
          const embeddingsModel = process.env.AZURE_EMBEDDINGS_MODEL || 'embed-v-4-0'
          const embeddingsDimensions = parseInt(process.env.AZURE_EMBEDDINGS_DIMENSIONS || '1536')

          const embeddingResponse = await fetch(embeddingsEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': embeddingsKey,
            },
            body: JSON.stringify({
              input: combinedText,
              model: embeddingsModel,
              dimensions: embeddingsDimensions,
            }),
          })

          if (!embeddingResponse.ok) {
            const errorText = await embeddingResponse.text()
            log(`[${Date.now() - startTime}ms] Warning: Failed to generate embedding: ${errorText}`)
            // Continue without embeddings - document still created
          } else {
            const embeddingData = await embeddingResponse.json()
            
            // Extract embedding from response
            let embedding: number[] = []
            if (embeddingData.data && Array.isArray(embeddingData.data) && embeddingData.data[0]?.embedding) {
              embedding = embeddingData.data[0].embedding
            } else if (Array.isArray(embeddingData)) {
              embedding = embeddingData[0]?.embedding || embeddingData[0]
            } else if (embeddingData.embedding) {
              embedding = embeddingData.embedding
            }

            if (embedding.length > 0) {
              // Store embedding in NeonDB as pgvector
              const embeddingArray = `[${embedding.join(',')}]`
              
              await sql`
                INSERT INTO document_embeddings (
                  id, document_id, content_text, embedding, chunk_index, metadata
                ) VALUES (
                  gen_random_uuid(),
                  ${documentId},
                  ${combinedText},
                  ${embeddingArray}::vector,
                  0,
                  '{}'::jsonb
                )
              `
              
              log(`[${Date.now() - startTime}ms] Embedding stored for document ${documentId}`)
            }
          }
        } catch (embeddingError: any) {
          log(`[${Date.now() - startTime}ms] Warning: Embedding generation failed: ${embeddingError.message}`)
          // Continue without embeddings - document still created
        }
      }
    }

    const totalTime = Date.now() - startTime
    log(`[${totalTime}ms] Document processing completed successfully`)

    return res.json({
      success: true,
      documentId,
      status,
      confidence: minConfidence,
      message: `Document processed successfully: ${fileName}`,
      processingTimeMs: totalTime,
    })
  } catch (err: any) {
    const totalTime = Date.now() - startTime
    error(`[${totalTime}ms] Error processing document: ${err.message}`)
    log(`[${totalTime}ms] Error processing document: ${err.message}`)
    return res.json({
      success: false,
      error: err.message || 'Failed to process document',
      processingTimeMs: totalTime,
    }, 500)
  }
}

