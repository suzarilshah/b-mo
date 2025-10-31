import { ReactNode } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { CompanyOnboarding } from './CompanyOnboarding'

interface CompanyGuardProps {
  children: ReactNode
}

/**
 * Wrapper component that ensures user has a company before showing protected content
 * Shows onboarding flow if no company exists
 */
export function CompanyGuard({ children }: CompanyGuardProps) {
  const { company, loading } = useCompany()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!company) {
    return <CompanyOnboarding />
  }

  return <>{children}</>
}

