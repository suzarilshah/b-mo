import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { TransactionList } from '@/components/dashboard/TransactionList'
import { TimeFilter, type TimeRange } from '@/components/dashboard/TimeFilter'
import { CompanyOnboarding } from '@/components/company/CompanyOnboarding'
import { useCompany } from '@/hooks/useCompany'
import { startOfMonth } from 'date-fns'

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { company, loading } = useCompany()
  const [timeRange, setTimeRange] = useState<TimeRange>(() => {
    const today = new Date()
    const start = startOfMonth(today)
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      label: 'This Month',
    }
  })

  // Save time range preference to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-time-range')
    if (saved) {
      try {
        setTimeRange(JSON.parse(saved))
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('dashboard-time-range', JSON.stringify(timeRange))
  }, [timeRange])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-gray-600">Loading company data...</div>
            </div>
          ) : company ? (
            <>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Active Company: <span className="font-medium">{company.name}</span>
                </p>
              </div>
              <div className="mb-6">
                <TimeFilter value={timeRange} onChange={setTimeRange} />
              </div>
              <div className="mb-6">
                <DashboardStats timeRange={timeRange} />
              </div>
              <div className="mt-6">
                <TransactionList timeRange={timeRange} />
              </div>
            </>
          ) : (
            <div>
              <CompanyOnboarding />
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

