import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { getTransactions } from '@/lib/neon/transactions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Transaction } from '@/lib/neon/schema'
import type { TimeRange } from './TimeFilter'

interface TransactionListProps {
  timeRange?: TimeRange
}

export function TransactionList({ timeRange }: TransactionListProps) {
  const { company } = useCompany()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (company) {
      loadTransactions()
    }
  }, [company?.id, timeRange])

  const loadTransactions = async () => {
    if (!company) return
    
    setLoading(true)
    try {
      const data = await getTransactions(company.id, {
        limit: 50,
        startDate: timeRange?.startDate,
        endDate: timeRange?.endDate,
      })
      setTransactions(data)
    } catch (error) {
      console.error('Failed to load transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!company) {
    return <div>No company selected</div>
  }

  if (loading) {
    return <div>Loading transactions...</div>
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{transaction.description || transaction.transaction_type}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    transaction.transaction_type === 'expense' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {transaction.amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: transaction.currency_code || 'USD',
                    })}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    transaction.status === 'posted' ? 'bg-green-100 text-green-700' :
                    transaction.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    transaction.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {transaction.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

