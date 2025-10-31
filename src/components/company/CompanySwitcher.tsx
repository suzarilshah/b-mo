import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useCompany } from '@/hooks/useCompany'
import { getUserCompanies } from '@/lib/neon/users'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Company } from '@/lib/neon/schema'

export function CompanySwitcher() {
  const { user } = useAuth()
  const router = useRouter()
  const { company, loading, switchCompany, refresh } = useCompany()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showSelector, setShowSelector] = useState(false)

  const loadCompanies = async () => {
    if (!user) return
    setLoadingCompanies(true)
    try {
      const userCompanies = await getUserCompanies(user.$id)
      setCompanies(userCompanies)
    } catch (error) {
      console.error('Failed to load companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleSwitch = async (companyId: string) => {
    try {
      await switchCompany(companyId)
      setShowSelector(false)
      await refresh()
    } catch (error) {
      console.error('Failed to switch company:', error)
    }
  }

  const handleCreateCompany = () => {
    setShowSelector(false)
    router.navigate({ to: '/dashboard' })
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>
  }

  if (!company) {
    return (
      <Button
        variant="outline"
        onClick={handleCreateCompany}
        className="bg-teal-50 border-teal-300 text-teal-700 hover:bg-teal-100"
      >
        Create Company
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => {
          setShowSelector(!showSelector)
          if (!showSelector) {
            loadCompanies()
          }
        }}
        className="flex items-center gap-2"
      >
        <span className="font-medium">{company.name}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {showSelector && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSelector(false)}
          />
          <Card className="absolute top-full mt-2 left-0 z-50 min-w-[200px] glass-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm">Switch Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingCompanies ? (
                <div className="text-sm text-gray-500">Loading...</div>
              ) : (
                <>
                  {companies.map((comp) => (
                    <Button
                      key={comp.id}
                      variant={comp.id === company.id ? 'default' : 'ghost'}
                      onClick={() => handleSwitch(comp.id)}
                      className="w-full justify-start"
                    >
                      {comp.name}
                    </Button>
                  ))}
                  {companies.length === 0 && (
                    <div className="text-sm text-gray-500 mb-2 text-center">
                      No other companies
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleCreateCompany}
                    className="w-full border-teal-300 text-teal-700 hover:bg-teal-50 mt-2"
                  >
                    + Create New Company
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

