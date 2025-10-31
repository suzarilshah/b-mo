import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { getTransactions } from '@/lib/neon/transactions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TimeRange } from './TimeFilter'

interface DashboardStats {
  totalSales: number
  totalIncome: number
  totalExpenses: number
  pendingReviews: number
}

interface DashboardStatsProps {
  timeRange?: TimeRange
}

export function DashboardStats({ timeRange }: DashboardStatsProps) {
  const { company } = useCompany()
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalIncome: 0,
    totalExpenses: 0,
    pendingReviews: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (company) {
      loadStats()
    }
  }, [company?.id, timeRange])

  const loadStats = async () => {
    if (!company) return

    setLoading(true)
    try {
      // Get transactions with date filter
      const transactions = await getTransactions(company.id, {
        limit: 1000,
        startDate: timeRange?.startDate,
        endDate: timeRange?.endDate,
      })

      // Calculate totals
      let totalSales = 0
      let totalIncome = 0
      let totalExpenses = 0
      let pendingReviews = 0

      for (const txn of transactions) {
        if (txn.transaction_type === 'sales' || txn.transaction_type === 'invoice') {
          totalSales += Number(txn.amount)
        }
        if (txn.transaction_type === 'revenue' || txn.transaction_type === 'income') {
          totalIncome += Number(txn.amount)
        }
        if (txn.transaction_type === 'expense') {
          totalExpenses += Number(txn.amount)
        }
        if (txn.status === 'pending') {
          pendingReviews++
        }
      }

      setStats({
        totalSales,
        totalIncome,
        totalExpenses,
        pendingReviews,
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">---</div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-600">
            ${stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            ${stats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
        </CardContent>
      </Card>
    </div>
  )
}

