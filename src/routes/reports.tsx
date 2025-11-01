import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ReportGenerator } from '@/components/reports/ReportGenerator'

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Financial Reports</h1>
          <ReportGenerator />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}


