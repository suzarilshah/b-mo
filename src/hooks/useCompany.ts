import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getUserWithDetails, updateUserCompany } from '@/lib/neon/users'
import type { Company } from '@/lib/neon/schema'

interface UseCompanyReturn {
  company: Company | null
  loading: boolean
  switchCompany: (companyId: string) => Promise<void>
  refresh: () => Promise<void>
}

/**
 * React hook for company context and management
 */
export function useCompany(): UseCompanyReturn {
  const { user } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const loadCompany = useCallback(async () => {
    if (!user) {
      setCompany(null)
      setLoading(false)
      return
    }

    try {
      const userDetails = await getUserWithDetails(user.$id)
      setCompany(userDetails?.company || null)
    } catch (error) {
      console.error('Failed to load company:', error)
      setCompany(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadCompany()
  }, [loadCompany])

  const switchCompany = useCallback(async (companyId: string) => {
    if (!user) throw new Error('User not authenticated')

    setLoading(true)
    try {
      await updateUserCompany(user.$id, companyId)
      await loadCompany()
    } catch (error) {
      setLoading(false)
      throw error
    }
  }, [user, loadCompany])

  return {
    company,
    loading,
    switchCompany,
    refresh: loadCompany,
  }
}

