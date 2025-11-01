import { createFileRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { UserSettings } from '@/components/settings/UserSettings'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <UserSettings />
      </AppLayout>
    </ProtectedRoute>
  )
}


