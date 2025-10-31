import { query } from './client'
import { getTransactions } from './transactions'
import { getAccountBalance } from './transactions'
import type { Reconciliation } from './schema'
import { chatCompletion } from '@/lib/azure/gpt5'

/**
 * Create a bank reconciliation
 */
export async function createReconciliation(
  companyId: string,
  accountId: string,
  reconciliationDate: string,
  statementBalance: number,
  reconciledBy: string
): Promise<Reconciliation> {
  const reconciliationId = crypto.randomUUID()

  // Get ledger balance
  const ledgerBalance = await getAccountBalance(companyId, accountId, reconciliationDate)

  // Get transactions for matching
  const transactions = await getTransactions(companyId, {
    startDate: reconciliationDate,
    endDate: reconciliationDate,
    limit: 1000,
  })

  // Simple matching logic (in production, use more sophisticated ML-based matching)
  const matchedTransactions: string[] = []
  const unmatchedItems: Array<{ type: string; amount: number; description?: string }> = []

  // For now, mark all transactions as matched if they exist
  // In production, this would use fuzzy matching against statement lines
  for (const txn of transactions) {
    matchedTransactions.push(txn.id)
  }

  const difference = statementBalance - ledgerBalance

  // If there's a difference, add it as unmatched
  if (Math.abs(difference) > 0.01) {
    unmatchedItems.push({
      type: 'difference',
      amount: difference,
      description: 'Balance difference between statement and ledger',
    })
  }

  const status = Math.abs(difference) < 0.01 ? 'completed' : 'discrepancy'

  const result = await query<Reconciliation>(
    `INSERT INTO reconciliations (
      id, company_id, account_id, reconciliation_date,
      statement_balance, ledger_balance, difference,
      matched_transactions, unmatched_items, status, reconciled_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)
    RETURNING *`,
    [
      reconciliationId,
      companyId,
      accountId,
      reconciliationDate,
      statementBalance,
      ledgerBalance,
      difference,
      JSON.stringify(matchedTransactions),
      JSON.stringify(unmatchedItems),
      status,
      reconciledBy,
    ]
  )

  return result[0]
}

/**
 * AI-powered reconciliation with intelligent matching
 */
export async function aiReconcile(
  companyId: string,
  _accountId: string,
  statementLines: Array<{
    date: string
    amount: number
    description: string
  }>,
  reconciliationDate: string
): Promise<{
  matched: number
  unmatched: number
  suggestions: Array<{ statementLine: any; suggestedTransaction?: string }>
}> {
  // Get ledger transactions
  const transactions = await getTransactions(companyId, {
    startDate: reconciliationDate,
    endDate: reconciliationDate,
    limit: 1000,
  })

  const suggestions: Array<{ statementLine: any; suggestedTransaction?: string }> = []

  // Use GPT-5 to help match statement lines to transactions
  for (const line of statementLines.slice(0, 20)) { // Limit for API calls
    try {
      const prompt = `Match this bank statement line to a transaction:

Statement Line:
Date: ${line.date}
Amount: ${line.amount}
Description: ${line.description}

Available Transactions:
${transactions.map(t => `- ${t.transaction_date}: ${t.description || t.transaction_type} - ${t.amount}`).join('\n')}

Return only the transaction ID if there's a match, or "NO_MATCH" if no match found.`

      const response = await chatCompletion([
        {
          role: 'system',
          content: 'You are a financial matching assistant. Match bank statement lines to transactions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ], {
        temperature: 0.1,
        maxTokens: 50,
      })

      const matchedId = transactions.find(t => response.includes(t.id))?.id

      suggestions.push({
        statementLine: line,
        suggestedTransaction: matchedId,
      })
    } catch (error) {
      console.error('Failed to get AI match:', error)
    }
  }

  const matched = suggestions.filter(s => s.suggestedTransaction).length
  const unmatched = suggestions.length - matched

  return { matched, unmatched, suggestions }
}

/**
 * Get reconciliations for a company
 */
export async function getReconciliations(
  companyId: string,
  _accountId?: string
): Promise<Reconciliation[]> {
  const sql = 'SELECT * FROM reconciliations WHERE company_id = $1 ORDER BY reconciliation_date DESC'
  return await query<Reconciliation>(sql, [companyId])
}

