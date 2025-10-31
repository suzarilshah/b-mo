import { getTransactions } from './transactions'

export interface Anomaly {
  transaction_id: string
  type: 'amount' | 'frequency' | 'pattern' | 'account'
  severity: 'low' | 'medium' | 'high'
  description: string
  confidence: number
  detected_at: Date
}

/**
 * Detect anomalies in transactions
 * Simple rule-based detection - can be enhanced with ML models
 */
export async function detectAnomalies(
  companyId: string,
  lookbackDays: number = 30
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = []

  // Get transactions from lookback period
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)

  const transactions = await getTransactions(companyId, {
    startDate: startDate.toISOString().split('T')[0],
    status: 'posted',
  })

  if (transactions.length === 0) {
    return []
  }

  // Calculate statistics
  const amounts = transactions.map(t => Number(t.amount))
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)

  // Detect amount anomalies (transactions > 3 standard deviations from mean)
  for (const txn of transactions) {
    const amount = Number(txn.amount)
    const zScore = Math.abs((amount - mean) / stdDev)

    if (zScore > 3 && stdDev > 0) {
      anomalies.push({
        transaction_id: txn.id,
        type: 'amount',
        severity: zScore > 5 ? 'high' : zScore > 4 ? 'medium' : 'low',
        description: `Transaction amount (${amount}) is ${zScore.toFixed(2)} standard deviations from the mean`,
        confidence: Math.min(0.95, zScore / 10),
        detected_at: new Date(),
      })
    }
  }

  // Detect frequency anomalies (unusual transaction patterns)
  const transactionsByType = new Map<string, number>()
  for (const txn of transactions) {
    const count = transactionsByType.get(txn.transaction_type) || 0
    transactionsByType.set(txn.transaction_type, count + 1)
  }

  const avgFrequency = transactions.length / transactionsByType.size

  for (const [type, count] of transactionsByType.entries()) {
    if (count > avgFrequency * 3) {
      // Find a representative transaction
      const sampleTxn = transactions.find(t => t.transaction_type === type)
      if (sampleTxn) {
        anomalies.push({
          transaction_id: sampleTxn.id,
          type: 'frequency',
          severity: count > avgFrequency * 5 ? 'high' : 'medium',
          description: `Unusual frequency: ${count} transactions of type "${type}" (expected ~${avgFrequency.toFixed(0)})`,
          confidence: 0.7,
          detected_at: new Date(),
        })
      }
    }
  }

  // Detect large round number amounts (potential fraud indicator)
  for (const txn of transactions) {
    const amount = Number(txn.amount)
    if (amount >= 1000 && amount % 1000 === 0) {
      anomalies.push({
        transaction_id: txn.id,
        type: 'pattern',
        severity: 'low',
        description: `Large round number transaction: ${amount}`,
        confidence: 0.5,
        detected_at: new Date(),
      })
    }
  }

  return anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

/**
 * Get anomalies for display
 */
export async function getAnomalies(
  companyId: string,
  _limit: number = 50
): Promise<Anomaly[]> {
  // In production, anomalies would be stored in database
  // For now, detect on-the-fly
  return await detectAnomalies(companyId)
}

