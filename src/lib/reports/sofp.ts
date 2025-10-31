import { query } from '@/lib/neon/client'
import { getAccountBalance } from '@/lib/neon/transactions'
import { getChartOfAccounts } from '@/lib/neon/chartOfAccounts'
import type { Company } from '@/lib/neon/schema'

export interface SOFPLineItem {
  account_code: string
  account_name: string
  amount: number
  level: number
  is_subtotal?: boolean
}

export interface SOFPReport {
  company: Company
  as_of_date: string
  assets: SOFPLineItem[]
  liabilities: SOFPLineItem[]
  equity: SOFPLineItem[]
  total_assets: number
  total_liabilities: number
  total_equity: number
}

/**
 * Generate Statement of Financial Position (Balance Sheet)
 */
export async function generateSOFP(
  companyId: string,
  asOfDate: string = new Date().toISOString().split('T')[0]
): Promise<SOFPReport> {
  // Get company
  const companies = await query<Company>(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  )
  const company = companies[0]
  if (!company) {
    throw new Error('Company not found')
  }

  // Get chart of accounts
  const accounts = await getChartOfAccounts(companyId)

  // Calculate balances for each account
  const assets: SOFPLineItem[] = []
  const liabilities: SOFPLineItem[] = []
  const equity: SOFPLineItem[] = []

  for (const account of accounts) {
    if (!account.is_active) continue

    const balance = await getAccountBalance(companyId, account.id, asOfDate)

    const lineItem: SOFPLineItem = {
      account_code: account.account_code,
      account_name: account.account_name,
      amount: balance,
      level: account.parent_account_id ? 1 : 0,
    }

    switch (account.account_type) {
      case 'asset':
        assets.push(lineItem)
        break
      case 'liability':
        liabilities.push(lineItem)
        break
      case 'equity':
        equity.push(lineItem)
        break
    }
  }

  // Sort by account code
  assets.sort((a, b) => a.account_code.localeCompare(b.account_code))
  liabilities.sort((a, b) => a.account_code.localeCompare(b.account_code))
  equity.sort((a, b) => a.account_code.localeCompare(b.account_code))

  // Calculate totals
  const total_assets = assets.reduce((sum, item) => sum + item.amount, 0)
  const total_liabilities = liabilities.reduce((sum, item) => sum + item.amount, 0)
  const total_equity = equity.reduce((sum, item) => sum + item.amount, 0)

  return {
    company,
    as_of_date: asOfDate,
    assets,
    liabilities,
    equity,
    total_assets,
    total_liabilities,
    total_equity,
  }
}

/**
 * Format SOFP for export
 */
export function formatSOFPForExport(report: SOFPReport): string[][] {
  const rows: string[][] = []

  // Header
  rows.push([`Statement of Financial Position - ${report.company.name}`])
  rows.push([`As of ${new Date(report.as_of_date).toLocaleDateString()}`])
  rows.push([])

  // Assets
  rows.push(['ASSETS'])
  rows.push(['Account Code', 'Account Name', 'Amount'])
  for (const item of report.assets) {
    rows.push([
      item.account_code,
      item.account_name,
      item.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: report.company.currency_code || 'USD',
      }),
    ])
  }
  rows.push(['', 'Total Assets', report.total_assets.toLocaleString('en-US', {
    style: 'currency',
    currency: report.company.currency_code || 'USD',
  })])
  rows.push([])

  // Liabilities
  rows.push(['LIABILITIES'])
  rows.push(['Account Code', 'Account Name', 'Amount'])
  for (const item of report.liabilities) {
    rows.push([
      item.account_code,
      item.account_name,
      item.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: report.company.currency_code || 'USD',
      }),
    ])
  }
  rows.push(['', 'Total Liabilities', report.total_liabilities.toLocaleString('en-US', {
    style: 'currency',
    currency: report.company.currency_code || 'USD',
  })])
  rows.push([])

  // Equity
  rows.push(['EQUITY'])
  rows.push(['Account Code', 'Account Name', 'Amount'])
  for (const item of report.equity) {
    rows.push([
      item.account_code,
      item.account_name,
      item.amount.toLocaleString('en-US', {
        style: 'currency',
        currency: report.company.currency_code || 'USD',
      }),
    ])
  }
  rows.push(['', 'Total Equity', report.total_equity.toLocaleString('en-US', {
    style: 'currency',
    currency: report.company.currency_code || 'USD',
  })])
  rows.push([])

  // Balance check
  const balance = report.total_assets - (report.total_liabilities + report.total_equity)
  rows.push(['Balance Check', balance === 0 ? 'BALANCED' : `DISCREPANCY: ${balance}`])

  return rows
}

