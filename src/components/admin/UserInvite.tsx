import { useState, useEffect } from 'react'
import { inviteUser } from '@/lib/api/users'
import { listRoles } from '@/lib/neon/roles'
import { useCompany } from '@/hooks/useCompany'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Role } from '@/lib/neon/schema'

export function UserInvite() {
  const { company } = useCompany()
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      const rolesList = await listRoles()
      setRoles(rolesList)
      if (rolesList.length > 0) {
        setRoleId(rolesList[0].id)
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) {
      setError('No company selected')
      return
    }

    if (!user) {
      setError('User not authenticated')
      return
    }

    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const role = roles.find(r => r.id === roleId)
      if (!role) {
        throw new Error('Invalid role selected')
      }

      const roleName = role.name as 'admin' | 'auditor' | 'finance_team'
      const result = await inviteUser(email, roleName, company.id, user.$id)

      if (result.success) {
        setSuccess(true)
        setEmail('')
      } else {
        setError(result.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  if (!company) {
    return <div>Please select a company first</div>
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Invite User</CardTitle>
        <CardDescription>Send an invitation to join {company.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              Invitation sent successfully!
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

