import { query } from './client'
import type { Transaction, TransactionLine } from './schema'
import { createAuditLog } from './audit'

/**
 * Get transactions for a company with filters
 */
export async function getTransactions(
  companyId: string,
  filters?: {
    startDate?: string
    endDate?: string
    status?: string
    type?: string
    limit?: number
    offset?: number
  }
): Promise<Transaction[]> {
  let sql = 'SELECT * FROM transactions WHERE company_id = $1'
  const params: any[] = [companyId]
  let paramIndex = 2

  if (filters?.startDate) {
    sql += ` AND transaction_date >= $${paramIndex}`
    params.push(filters.startDate)
    paramIndex++
  }
  if (filters?.endDate) {
      sql += ` AND transaction_date <= $${paramIndex}`
      params.push(filters.endDate)
      paramIndex++
    }
  if (filters?.status) {
    sql += ` AND status = $${paramIndex}`
    params.push(filters.status)
    paramIndex++
  }
  if (filters?.type) {
    sql += ` AND transaction_type = $${paramIndex}`
    params.push(filters.type)
    paramIndex++
  }

  sql += ' ORDER BY transaction_date DESC, created_at DESC'

  if (filters?.limit) {
    sql += ` LIMIT $${paramIndex}`
    params.push(filters.limit)
    paramIndex++
    if (filters.offset) {
      sql += ` OFFSET $${paramIndex}`
      params.push(filters.offset)
    }
  }

  return await query<Transaction>(sql, params)
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(
  companyId: string,
  transactionId: string
): Promise<Transaction | null> {
  const result = await query<Transaction>(
    'SELECT * FROM transactions WHERE id = $1 AND company_id = $2 LIMIT 1',
    [transactionId, companyId]
  )
  return result[0] || null
}

/**
 * Get transaction lines for a transaction
 */
export async function getTransactionLines(
  transactionId: string
): Promise<TransactionLine[]> {
  return await query<TransactionLine>(
    `SELECT tl.*, ca.account_code, ca.account_name, ca.account_type
     FROM transaction_lines tl
     JOIN chart_of_accounts ca ON tl.account_id = ca.id
     WHERE tl.transaction_id = $1
     ORDER BY tl.line_order`,
    [transactionId]
  )
}

/**
 * Create a new transaction with lines
 */
export async function createTransaction(
  companyId: string,
  data: {
    transaction_date: string
    transaction_number?: string
    description?: string
    transaction_type: string
    amount: number
    currency_code?: string
    created_by: string
  },
  lines: Array<{
    account_id: string
    debit_amount?: number
    credit_amount?: number
    description?: string
    line_order: number
  }>
): Promise<Transaction> {
  const transactionId = crypto.randomUUID()

  // Verify debit = credit
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit_amount || 0), 0)
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit_amount || 0), 0)
  
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Transaction must be balanced (debits = credits)')
  }

  // Create transaction
  const transaction = await query<Transaction>(
    `INSERT INTO transactions (
      id, company_id, transaction_date, transaction_number, description,
      transaction_type, amount, currency_code, status, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
    RETURNING *`,
    [
      transactionId,
      companyId,
      data.transaction_date,
      data.transaction_number || null,
      data.description || null,
      data.transaction_type,
      data.amount,
      data.currency_code || 'USD',
      data.created_by,
    ]
  )

  // Create transaction lines
  for (const line of lines) {
    await query(
      `INSERT INTO transaction_lines (
        id, transaction_id, account_id, debit_amount, credit_amount, description, line_order
      ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
      [
        transactionId,
        line.account_id,
        line.debit_amount || 0,
        line.credit_amount || 0,
        line.description || null,
        line.line_order,
      ]
    )
  }

  const transactionRecord = transaction[0]

  // Create audit log
  await createAuditLog(
    companyId,
    data.created_by,
    'create',
    'transaction',
    transactionRecord.id,
    undefined,
    { transaction_type: data.transaction_type, amount: data.amount }
  )

  return transactionRecord
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  companyId: string,
  transactionId: string,
  status: 'pending' | 'approved' | 'rejected' | 'posted',
  approvedBy?: string
): Promise<Transaction> {
  const updates: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP']
  const params: any[] = [status]
  let paramIndex = 2

  if (status === 'approved' || status === 'posted') {
    updates.push(`approved_by = $${paramIndex}`)
    params.push(approvedBy || null)
    paramIndex++
  }

  if (status === 'posted') {
    updates.push(`posted_at = CURRENT_TIMESTAMP`)
  }

  params.push(transactionId, companyId)
  updates.push(`id = $${paramIndex}`, `company_id = $${paramIndex + 1}`)

  const result = await query<Transaction>(
    `UPDATE transactions SET ${updates.join(', ')} 
     WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
     RETURNING *`,
    params
  )

  if (!result[0]) {
    throw new Error('Transaction not found')
  }

  // Create audit log
  await createAuditLog(
    companyId,
    approvedBy || null,
    status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'update',
    'transaction',
    transactionId,
    undefined,
    { status }
  )

  return result[0]
}

/**
 * Get account balance
 */
export async function getAccountBalance(
  companyId: string,
  accountId: string,
  asOfDate?: string
): Promise<number> {
  let sql = `
    SELECT 
      SUM(CASE WHEN ca.balance_type = 'debit' THEN tl.debit_amount - tl.credit_amount
               ELSE tl.credit_amount - tl.debit_amount END) as balance
    FROM transaction_lines tl
    JOIN transactions t ON tl.transaction_id = t.id
    JOIN chart_of_accounts ca ON tl.account_id = ca.id
    WHERE tl.account_id = $1 AND t.company_id = $2 AND t.status = 'posted'
  `
  const params: any[] = [accountId, companyId]

  if (asOfDate) {
    sql += ' AND t.transaction_date <= $3'
    params.push(asOfDate)
  }

  const result = await query<{ balance: number | null }>(sql, params)
  return result[0]?.balance || 0
}

