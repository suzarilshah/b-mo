/**
 * Convert data to CSV format
 */
export function arrayToCSV(data: any[][]): string {
  return data
    .map((row) =>
      row
        .map((cell) => {
          const stringCell = String(cell ?? '')
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
            return `"${stringCell.replace(/"/g, '""')}"`
          }
          return stringCell
        })
        .join(',')
    )
    .join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(
  transactions: any[],
  filename: string = 'transactions.csv'
) {
  const headers = [
    'Date',
    'Number',
    'Description',
    'Type',
    'Amount',
    'Currency',
    'Status',
  ]

  const rows = transactions.map((t) => [
    t.transaction_date,
    t.transaction_number || '',
    t.description || '',
    t.transaction_type,
    t.amount,
    t.currency_code || 'USD',
    t.status,
  ])

  const csv = arrayToCSV([headers, ...rows])
  downloadCSV(csv, filename)
}

