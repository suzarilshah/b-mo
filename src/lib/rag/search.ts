import { generateEmbedding } from '@/lib/azure/embeddings'
import { searchDocumentsByVector } from '@/lib/neon/documents'
import { query } from '@/lib/neon/client'
import type { Transaction } from '@/lib/neon/schema'

/**
 * Search documents using natural language query
 */
export async function searchDocuments(
  companyId: string,
  queryText: string,
  limit: number = 5
): Promise<Array<{
  document_id: string
  file_name: string
  content: string
  similarity: number
  extracted_data?: Record<string, any>
}>> {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(queryText)

  // Search in document embeddings
  const documents = await searchDocumentsByVector(
    companyId,
    queryEmbedding,
    limit,
    0.5 // similarity threshold
  )

  return documents.map((doc) => ({
    document_id: doc.id,
    file_name: doc.file_name,
    content: doc.extracted_data
      ? JSON.stringify(doc.extracted_data)
      : 'No extracted data available',
    similarity: doc.similarity,
    extracted_data: doc.extracted_data || undefined,
  }))
}

/**
 * Search transactions using natural language
 */
export async function searchTransactions(
  companyId: string,
  queryText: string,
  limit: number = 10
): Promise<Transaction[]> {
  // For now, simple text search on transaction descriptions
  // In the future, this could use embeddings on transaction data
  const result = await query<Transaction>(
    `SELECT * FROM transactions 
     WHERE company_id = $1 
       AND (LOWER(description) LIKE LOWER($2) 
            OR LOWER(transaction_type) LIKE LOWER($2))
     ORDER BY transaction_date DESC
     LIMIT $3`,
    [companyId, `%${queryText}%`, limit]
  )

  return result
}

/**
 * Get account information for RAG context
 */
export async function getAccountInfo(
  companyId: string,
  accountCode?: string
): Promise<any[]> {
  let sql = `SELECT ca.*, 
       (SELECT SUM(CASE WHEN ca.balance_type = 'debit' 
                        THEN tl.debit_amount - tl.credit_amount
                        ELSE tl.credit_amount - tl.debit_amount END)
        FROM transaction_lines tl
        JOIN transactions t ON tl.transaction_id = t.id
        WHERE tl.account_id = ca.id AND t.company_id = $1 AND t.status = 'posted'
       ) as current_balance
     FROM chart_of_accounts ca
     WHERE ca.company_id = $1 AND ca.is_active = true`

  const params: any[] = [companyId]

  if (accountCode) {
    sql += ' AND ca.account_code = $2'
    params.push(accountCode)
  }

  sql += ' ORDER BY ca.account_code'

  return await query(sql, params)
}

/**
 * Build context for RAG from search results
 */
export function buildRAGContext(
  documents: Array<{ file_name: string; content: string; similarity: number }>,
  transactions: Transaction[],
  accounts?: any[]
): string {
  const contextParts: string[] = []

  if (documents.length > 0) {
    contextParts.push('## Relevant Documents:')
    for (const doc of documents.slice(0, 3)) {
      contextParts.push(`- ${doc.file_name} (relevance: ${(doc.similarity * 100).toFixed(1)}%)`)
      contextParts.push(`  Content: ${doc.content.substring(0, 200)}...`)
    }
  }

  if (transactions.length > 0) {
    contextParts.push('\n## Related Transactions:')
    for (const txn of transactions.slice(0, 5)) {
      contextParts.push(
        `- ${txn.transaction_date}: ${txn.description || txn.transaction_type} - ${txn.amount} ${txn.currency_code || 'USD'}`
      )
    }
  }

  if (accounts && accounts.length > 0) {
    contextParts.push('\n## Account Information:')
    for (const account of accounts.slice(0, 3)) {
      contextParts.push(
        `- ${account.account_code}: ${account.account_name} (Balance: ${account.current_balance || 0})`
      )
    }
  }

  return contextParts.join('\n')
}

