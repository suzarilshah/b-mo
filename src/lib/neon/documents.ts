import { query } from './client'
import type { Document, DocumentEmbedding } from './schema'
import { uploadFile } from '@/lib/appwrite/storage'
import { processDocumentFunction, type ProcessDocumentRequest } from '@/lib/appwrite/functions'

/**
 * Get documents for a company
 */
export async function getDocuments(
  companyId: string,
  filters?: {
    document_type?: string
    status?: string
    requires_review?: boolean
    limit?: number
    offset?: number
  }
): Promise<Document[]> {
  let sql = 'SELECT * FROM documents WHERE company_id = $1'
  const params: any[] = [companyId]
  let paramIndex = 2

  if (filters?.document_type) {
    sql += ` AND document_type = $${paramIndex}`
    params.push(filters.document_type)
    paramIndex++
  }
  if (filters?.status) {
    sql += ` AND status = $${paramIndex}`
    params.push(filters.status)
    paramIndex++
  }
  if (filters?.requires_review !== undefined) {
    sql += ` AND requires_review = $${paramIndex}`
    params.push(filters.requires_review)
    paramIndex++
  }

  sql += ' ORDER BY created_at DESC'

  if (filters?.limit) {
    sql += ` LIMIT $${paramIndex}`
    params.push(filters.limit)
    paramIndex++
    if (filters.offset) {
      sql += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
    }
  }

  return await query<Document>(sql, params)
}

/**
 * Get document by ID
 */
export async function getDocumentById(
  companyId: string,
  documentId: string
): Promise<Document | null> {
  const result = await query<Document>(
    'SELECT * FROM documents WHERE id = $1 AND company_id = $2 LIMIT 1',
    [documentId, companyId]
  )
  return result[0] || null
}

/**
 * Process document upload and analysis
 * Now delegates to Appwrite Function for server-side processing
 */
export async function processDocument(
  companyId: string,
  file: File,
  uploadedBy: string
): Promise<Document> {
  // 1. Upload to Appwrite Storage (client-side)
  const { fileId } = await uploadFile(file)

  // 2. Call Appwrite Function for server-side processing
  // The function handles: OCR, embeddings generation, and NeonDB storage
  const request: ProcessDocumentRequest = {
    fileId,
    companyId,
    uploadedBy,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  }

  const result = await processDocumentFunction(request)

  if (!result.success || !result.documentId) {
    throw new Error(result.error || 'Failed to process document')
  }

  // 3. Retrieve the created document from NeonDB
  const document = await getDocumentById(companyId, result.documentId)

  if (!document) {
    throw new Error('Document was created but could not be retrieved')
  }

  return document
}

/**
 * Generate embeddings for document content
 * NOTE: This is now handled by the Appwrite Function process-document
 * Kept here for backward compatibility if needed, but should not be called directly
 * @deprecated Use Appwrite Function for document processing
 */
async function generateDocumentEmbeddings(
  _documentId: string,
  _extractedFields: Record<string, any>
): Promise<void> {
  // This function is deprecated - embeddings are now generated server-side
  // via the Appwrite Function process-document
  console.warn('generateDocumentEmbeddings is deprecated - use Appwrite Function for processing')
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  companyId: string,
  documentId: string,
  status: 'uploaded' | 'processing' | 'review' | 'approved' | 'rejected',
  reviewedBy?: string
): Promise<Document> {
  const result = await query<Document>(
    `UPDATE documents 
     SET status = $1, reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND company_id = $4
     RETURNING *`,
    [status, reviewedBy || null, documentId, companyId]
  )

  if (!result[0]) {
    throw new Error('Document not found')
  }

  return result[0]
}

/**
 * Search documents using vector similarity
 */
export async function searchDocumentsByVector(
  companyId: string,
  queryEmbedding: number[],
  limit: number = 10,
  threshold: number = 0.7
): Promise<Array<Document & { similarity: number }>> {
  const embeddingArray = `[${queryEmbedding.join(',')}]`
  
  const result = await query<Document & { similarity: number }>(
    `SELECT d.*, 1 - (de.embedding <=> $1) as similarity
     FROM documents d
     JOIN document_embeddings de ON d.id = de.document_id
     WHERE d.company_id = $2 
       AND 1 - (de.embedding <=> $1) >= $3
     ORDER BY de.embedding <=> $1
     LIMIT $4`,
    [embeddingArray, companyId, threshold, limit]
  )

  return result
}

/**
 * Get document embeddings
 */
export async function getDocumentEmbeddings(
  documentId: string
): Promise<DocumentEmbedding[]> {
  return await query<DocumentEmbedding>(
    'SELECT * FROM document_embeddings WHERE document_id = $1 ORDER BY chunk_index',
    [documentId]
  )
}

