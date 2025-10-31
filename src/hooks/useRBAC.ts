import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getUserWithDetails } from '@/lib/neon/users'
import { hasPermission as checkPermission } from '@/lib/neon/roles'
import type { Role } from '@/lib/neon/schema'

interface UseRBACReturn {
  role: Role | null
  loading: boolean
  hasPermission: (permission: string) => Promise<boolean>
  isAdmin: boolean
  isAuditor: boolean
  isFinanceTeam: boolean
}

/**
 * React hook for Role-Based Access Control
 */
export function useRBAC(): UseRBACReturn {
  const { user } = useAuth()
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  const loadRole = useCallback(async () => {
    if (!user) {
      setRole(null)
      setLoading(false)
      return
    }

    try {
      const userDetails = await getUserWithDetails(user.$id)
      setRole(userDetails?.role || null)
    } catch (error) {
      console.error('Failed to load role:', error)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadRole()
  }, [loadRole])

  const checkPermissionHandler = useCallback(async (permission: string): Promise<boolean> => {
    if (!user || !role) return false
    return await checkPermission(role.id, permission)
  }, [user, role])

  const isAdmin = role?.name === 'admin'
  const isAuditor = role?.name === 'auditor'
  const isFinanceTeam = role?.name === 'finance_team'

  return {
    role,
    loading,
    hasPermission: checkPermissionHandler,
    isAdmin,
    isAuditor,
    isFinanceTeam,
  }
}

