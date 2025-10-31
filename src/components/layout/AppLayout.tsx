import { ReactNode } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'
import { useRBAC } from '@/hooks/useRBAC'
import { useCompany } from '@/hooks/useCompany'
import { CompanySwitcher } from '@/components/company/CompanySwitcher'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth()
  const { isAdmin } = useRBAC()
  const { company } = useCompany()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.navigate({ to: '/' })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-orange-50 to-yellow-50">
      {/* Navigation Bar */}
      <nav className="glass-card border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-teal-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                B-mo
              </Link>
              <div className="flex gap-4">
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Link to="/documents">
                  <Button variant="ghost">Documents</Button>
                </Link>
                <Link to="/reports">
                  <Button variant="ghost">Reports</Button>
                </Link>
                <Link to="/chat">
                  <Button variant="ghost">Chat</Button>
                </Link>
                <Link to="/forecasting">
                  <Button variant="ghost">Forecasting</Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost">Admin</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {company && <CompanySwitcher />}
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
              <div className="text-sm text-gray-600">
                {user?.name || user?.email}
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

