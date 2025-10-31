import { chatCompletion } from '@/lib/azure/gpt5'
import type { SOFPReport } from './sofp'
import type { SOPLReport } from './sopl'

/**
 * Generate AI-powered summary of financial reports
 */
export async function summarizeSOFP(report: SOFPReport): Promise<string> {
  const prompt = `You are a financial analyst. Analyze the following Statement of Financial Position and provide:
1. Key insights about the company's financial position
2. Notable changes or trends
3. Areas of concern or strength
4. Recommendations for management

Company: ${report.company.name}
Date: ${report.as_of_date}

ASSETS:
${report.assets.map(a => `${a.account_code}: ${a.account_name} - ${a.amount.toLocaleString()}`).join('\n')}
Total Assets: ${report.total_assets.toLocaleString()}

LIABILITIES:
${report.liabilities.map(l => `${l.account_code}: ${l.account_name} - ${l.amount.toLocaleString()}`).join('\n')}
Total Liabilities: ${report.total_liabilities.toLocaleString()}

EQUITY:
${report.equity.map(e => `${e.account_code}: ${e.account_name} - ${e.amount.toLocaleString()}`).join('\n')}
Total Equity: ${report.total_equity.toLocaleString()}

Provide a concise, professional analysis.`

  const messages = [
    {
      role: 'system' as const,
      content: 'You are an expert financial analyst providing insights on accounting reports.',
    },
    {
      role: 'user' as const,
      content: prompt,
    },
  ]

  return await chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 1000,
  })
}

/**
 * Generate AI-powered summary of profit and loss statement
 */
export async function summarizeSOPL(report: SOPLReport): Promise<string> {
  const prompt = `You are a financial analyst. Analyze the following Statement of Profit or Loss and provide:
1. Key insights about the company's profitability
2. Revenue trends and major revenue sources
3. Expense analysis and cost structure
4. Profitability recommendations

Company: ${report.company.name}
Period: ${report.period_start} to ${report.period_end}

REVENUE:
${report.revenue.map((r: { account_code: string; account_name: string; amount: number }) => `${r.account_code}: ${r.account_name} - ${r.amount.toLocaleString()}`).join('\n')}
Total Revenue: ${report.total_revenue.toLocaleString()}

EXPENSES:
${report.expenses.map((e: { account_code: string; account_name: string; amount: number }) => `${e.account_code}: ${e.account_name} - ${e.amount.toLocaleString()}`).join('\n')}
Total Expenses: ${report.total_expenses.toLocaleString()}

NET INCOME: ${report.net_income.toLocaleString()}

Provide a concise, professional analysis with actionable insights.`

  const messages = [
    {
      role: 'system' as const,
      content: 'You are an expert financial analyst providing insights on profit and loss statements.',
    },
    {
      role: 'user' as const,
      content: prompt,
    },
  ]

  return await chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 1000,
  })
}

