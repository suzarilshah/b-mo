import { query } from '@/lib/neon/client'
import { getTransactions } from '@/lib/neon/transactions'
import { getChartOfAccounts } from '@/lib/neon/chartOfAccounts'
import type { Company } from '@/lib/neon/schema'

export interface SOPLLineItem {
  account_code: string
  account_name: string
  amount: number
  level: number
}

export interface SOPLReport {
  company: Company
  period_start: string
  period_end: string
  revenue: SOPLLineItem[]
  expenses: SOPLLineItem[]
  total_revenue: number
  total_expenses: number
  net_income: number
}

/**
 * Generate Statement of Profit or Loss (Income Statement)
 */
export async function generateSOPL(
  companyId: string,
  periodStart: string,
  periodEnd: string
): Promise<SOPLReport> {
  // Get company
  const companies = await query<Company>(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  )
  const company = companies[0]
  if (!company) {
    throw new Error('Company not found')
  }

  // Get transactions in period
  const transactions = await getTransactions(companyId, {
    startDate: periodStart,
    endDate: periodEnd,
    status: 'posted',
  })

  // Get chart of accounts
  const accounts = await getChartOfAccounts(companyId)

  // Group transactions by account
  const accountAmounts = new Map<string, number>()

  for (const transaction of transactions) {
    // Get transaction lines
    const lines = await query<{
      account_id: string
      debit_amount: number
      credit_amount: number
      account_type: string
      balance_type: string
    }>(
      `SELECT tl.account_id, tl.debit_amount, tl.credit_amount,
              ca.account_type, ca.balance_type
       FROM transaction_lines tl
       JOIN chart_of_accounts ca ON tl.account_id = ca.id
       WHERE tl.transaction_id = $1`,
      [transaction.id]
    )

    for (const line of lines) {
      const current = accountAmounts.get(line.account_id) || 0
      // For revenue/expense accounts, credits increase revenue, debits increase expenses
      if (line.account_type === 'revenue') {
        accountAmounts.set(line.account_id, current + line.credit_amount - line.debit_amount)
      } else if (line.account_type === 'expense') {
        accountAmounts.set(line.account_id, current + line.debit_amount - line.credit_amount)
      }
    }
  }

  // Build line items
  const revenue: SOPLLineItem[] = []
  const expenses: SOPLLineItem[] = []

  for (const account of accounts) {
    if (!account.is_active) continue

    const amount = accountAmounts.get(account.id) || 0
    if (amount === 0) continue

    const lineItem: SOPLLineItem = {
      account_code: account.account_code,
      account_name: account.account_name,
      amount,
      level: account.parent_account_id ? 1 : 0,
    }

    if (account.account_type === 'revenue') {
      revenue.push(lineItem)
    } else if (account.account_type === 'expense') {
      expenses.push(lineItem)
    }
  }

  // Sort by account code
  revenue.sort((a, b) => a.account_code.localeCompare(b.account_code))
  expenses.sort((a, b) => a.account_code.localeCompare(b.account_code))

  // Calculate totals
  const total_revenue = revenue.reduce((sum, item) => sum + item.amount, 0)
  const total_expenses = expenses.reduce((sum, item) => sum + item.amount, 0)
  const net_income = total_revenue - total_expenses

  return {
    company,
    period_start: periodStart,
    period_end: periodEnd,
    revenue,
    expenses,
    total_revenue,
    total_expenses,
    net_income,
  }
}

/**
 * Format SOPL for export
 */
export function formatSOPLForExport(report: SOPLReport): string[][] {
  const rows: string[][] = []

  // Header
  rows.push([`Statement of Profit or Loss - ${report.company.name}`])
  rows.push([`Period: ${new Date(report.period_start).toLocaleDateString()} to ${new Date(report.period_end).toLocaleDateString()}`])
  rows.push([])

  // Revenue
  rows.push(['REVENUE'])
  rows.push(['Account Code', 'Account Name', 'Amount'])
  for (const item of report.revenue) {
    rows.push([
      item.account_code,
      item.account_name,
      item.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: report.company.currency_code || 'USD',
      }),
    ])
  }
  rows.push(['', 'Total Revenue', report.total_revenue.toLocaleString('en-US', {
    style: 'currency',
    currency: report.company.currency_code || 'USD',
  })])
  rows.push([])

  // Expenses
  rows.push(['EXPENSES'])
  rows.push(['Account Code', 'Account Name', 'Amount'])
  for (const item of report.expenses) {
    rows.push([
      item.account_code,
      item.account_name,
      item.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: report.company.currency_code || 'USD',
      }),
    ])
  }
  rows.push(['', 'Total Expenses', report.total_expenses.toLocaleString('en-US', {
    style: 'currency',
    currency: report.company.currency_code || 'USD',
  })])
  rows.push([])

  // Net Income
  rows.push(['NET INCOME', '', report.net_income.toLocaleString('en-US', {
    style: 'currency',
    currency: report.company.currency_code || 'USD',
  })])

  return rows
}


