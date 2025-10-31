import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { ForecastDashboard } from '@/components/forecasting/ForecastDashboard'

export const Route = createFileRoute('/forecasting')({
  component: ForecastingPage,
})

function ForecastingPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Forecasting</h1>
          <ForecastDashboard />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

