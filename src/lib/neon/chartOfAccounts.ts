import { query } from './client'
import type { ChartOfAccount } from './schema'

/**
 * Get chart of accounts for a company
 */
export async function getChartOfAccounts(
  companyId: string,
  includeInactive: boolean = false
): Promise<ChartOfAccount[]> {
  let sql = 'SELECT * FROM chart_of_accounts WHERE company_id = $1'
  const params: any[] = [companyId]

  if (!includeInactive) {
    sql += ' AND is_active = true'
  }

  sql += ' ORDER BY account_code'

  return await query<ChartOfAccount>(sql, params)
}

/**
 * Get account by ID
 */
export async function getAccountById(
  companyId: string,
  accountId: string
): Promise<ChartOfAccount | null> {
  const result = await query<ChartOfAccount>(
    'SELECT * FROM chart_of_accounts WHERE id = $1 AND company_id = $2 LIMIT 1',
    [accountId, companyId]
  )
  return result[0] || null
}

/**
 * Create new account
 */
export async function createAccount(
  companyId: string,
  data: {
    account_code: string
    account_name: string
    account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
    parent_account_id?: string
    balance_type: 'debit' | 'credit'
  }
): Promise<ChartOfAccount> {
  const accountId = crypto.randomUUID()

  const result = await query<ChartOfAccount>(
    `INSERT INTO chart_of_accounts (
      id, company_id, account_code, account_name, account_type,
      parent_account_id, balance_type, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    RETURNING *`,
    [
      accountId,
      companyId,
      data.account_code,
      data.account_name,
      data.account_type,
      data.parent_account_id || null,
      data.balance_type,
    ]
  )

  return result[0]
}

/**
 * Update account
 */
export async function updateAccount(
  companyId: string,
  accountId: string,
  data: Partial<Pick<ChartOfAccount, 'account_code' | 'account_name' | 'is_active'>>
): Promise<ChartOfAccount> {
  const updates: string[] = []
  const params: any[] = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`)
      params.push(value)
      paramIndex++
    }
  }

  if (updates.length === 0) {
    throw new Error('No fields to update')
  }

  updates.push('updated_at = CURRENT_TIMESTAMP')
  params.push(accountId, companyId)

  const result = await query<ChartOfAccount>(
    `UPDATE chart_of_accounts SET ${updates.join(', ')}
     WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
     RETURNING *`,
    params
  )

  if (!result[0]) {
    throw new Error('Account not found')
  }

  return result[0]
}

/**
 * Get account hierarchy (tree structure)
 */
export async function getAccountHierarchy(
  companyId: string
): Promise<ChartOfAccount[]> {
  const accounts = await getChartOfAccounts(companyId)
  
  // Build hierarchy
  const accountMap = new Map<string, ChartOfAccount>()

  // Index all accounts
  for (const account of accounts) {
    accountMap.set(account.id, account)
  }

  // Build tree (this is simplified - in production you'd want a proper tree structure)
  return accounts.sort((a, b) => a.account_code.localeCompare(b.account_code))
}

