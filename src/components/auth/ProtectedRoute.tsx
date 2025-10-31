import { ReactNode, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'auditor' | 'finance_team'
}

/**
 * Component that protects routes requiring authentication
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.navigate({ to: '/login' })
      } else if (requiredRole) {
        // Role checking will be implemented when we have user roles from database
        // For now, we just check if user exists
      }
    }
  }, [user, loading, router, requiredRole])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

