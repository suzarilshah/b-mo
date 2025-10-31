import { useState, useEffect } from 'react'
import { getCurrentUser, signIn, signOut, signUp, type AuthUser } from '@/lib/appwrite/auth'
import { createOrUpdateUser } from '@/lib/neon/users'

interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

/**
 * React hook for authentication state
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        // Sync user to NeonDB
        try {
          await createOrUpdateUser(
            currentUser.$id,
            currentUser.email,
            currentUser.name,
            undefined, // companyId will be set later
            undefined  // roleId will be set later
          )
        } catch (error) {
          console.error('Failed to sync user to database:', error)
          // Continue even if sync fails
        }
        setUser(currentUser)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      await signIn(email, password)
      await loadUser()
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const newUser = await signUp(email, password, name)
      // Create user record in NeonDB
      if (newUser) {
        await createOrUpdateUser(
          newUser.$id,
          newUser.email,
          newUser.name
        )
      }
      await loadUser()
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await signOut()
      setUser(null)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    refresh: loadUser,
  }
}

