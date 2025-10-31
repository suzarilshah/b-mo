import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { UserInvite } from '@/components/admin/UserInvite'
import { AuditLogViewer } from '@/components/admin/AuditLogViewer'
import { AnomalyDetection } from '@/components/admin/AnomalyDetection'
import { TeamManagement } from '@/components/admin/TeamManagement'
import { useRBAC } from '@/hooks/useRBAC'

export const Route = createFileRoute('/admin')({
  component: AdminPage,
})

function AdminPage() {
  const { isAdmin, loading } = useRBAC()

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div>Loading...</div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You must be an administrator to access this page.</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <div>
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Panel</h1>
          <div className="space-y-6">
            <TeamManagement />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <UserInvite />
              <AnomalyDetection />
            </div>
            <div className="mt-6">
              <AuditLogViewer />
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

