import * as XLSX from 'xlsx'

/**
 * Generate Excel file from data
 */
export function generateExcel(
  data: any[][],
  sheetName: string = 'Sheet1'
): Blob {
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Download Excel file
 */
export function downloadExcel(blob: Blob, filename: string) {
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
 * Export transactions to Excel
 */
export function exportTransactionsToExcel(
  transactions: any[],
  filename: string = 'transactions.xlsx'
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

  const data = [headers, ...rows]
  const blob = generateExcel(data, 'Transactions')
  downloadExcel(blob, filename)
}

