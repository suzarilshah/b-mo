import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { useRBAC } from '@/hooks/useRBAC'
import { getInvitationsByCompany, getActiveUsersByCompany, deleteInvitation, updateInvitationRole, updateUserRoleInCompany } from '@/lib/neon/invitations'
import { listRoles } from '@/lib/neon/roles'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Invitation, Role, User } from '@/lib/neon/schema'
import { Trash2, UserPlus, Users } from 'lucide-react'

interface UserWithRole extends User {
  role_name?: string
}

export function TeamManagement() {
  const { company } = useCompany()
  const { isAdmin } = useRBAC()
  const [invitations, setInvitations] = useState<Array<Invitation & { role_name?: string; inviter_name?: string }>>([])
  const [activeUsers, setActiveUsers] = useState<UserWithRole[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (company && isAdmin) {
      loadData()
    }
  }, [company?.id, isAdmin])

  const loadData = async () => {
    if (!company) return

    setLoading(true)
    try {
      const [invites, users, rolesList] = await Promise.all([
        getInvitationsByCompany(company.id),
        getActiveUsersByCompany(company.id),
        listRoles(),
      ])
      setInvitations(invites)
      setActiveUsers(users)
      setRoles(rolesList)
    } catch (error: any) {
      toast.error('Failed to load team data', {
        description: error.message || 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (type: 'invitation' | 'user', id: string, roleId: string) => {
    if (!isAdmin) {
      toast.error('Unauthorized', {
        description: 'Only admins can change roles.',
      })
      return
    }

    setUpdating(id)
    try {
      if (type === 'invitation') {
        await updateInvitationRole(id, roleId)
        toast.success('Role updated', {
          description: 'The invitation role has been updated.',
        })
      } else {
        await updateUserRoleInCompany(id, roleId)
        toast.success('Role updated', {
          description: 'The user role has been updated.',
        })
      }
      await loadData()
    } catch (error: any) {
      toast.error('Failed to update role', {
        description: error.message || 'Please try again.',
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!isAdmin) {
      toast.error('Unauthorized')
      return
    }

    if (!confirm('Are you sure you want to remove this invitation?')) {
      return
    }

    try {
      await deleteInvitation(invitationId)
      toast.success('Invitation removed', {
        description: 'The invitation has been deleted.',
      })
      await loadData()
    } catch (error: any) {
      toast.error('Failed to remove invitation', {
        description: error.message || 'Please try again.',
      })
    }
  }

  if (!isAdmin) {
    return (
      <Card className="glass-card">
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">You must be an admin to access team management.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="py-8 text-center">
            <p className="text-gray-600">Loading team data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Team Management</h1>
        <p className="text-gray-600">Manage invitations and active users for {company?.name}</p>
      </div>

      {/* Active Users */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <CardTitle>Active Users</CardTitle>
          </div>
          <CardDescription>Users who have joined the company</CardDescription>
        </CardHeader>
        <CardContent>
          {activeUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active users yet
            </div>
          ) : (
            <div className="space-y-3">
              {activeUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <select
                      value={user.role_id || ''}
                      onChange={(e) => handleUpdateRole('user', user.id, e.target.value)}
                      disabled={updating === user.id}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-600" />
            <CardTitle>Pending Invitations</CardTitle>
          </div>
          <CardDescription>Users who have been invited but not yet joined</CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.filter(inv => inv.status === 'pending').length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending invitations
            </div>
          ) : (
            <div className="space-y-3">
              {invitations
                .filter(inv => inv.status === 'pending')
                .map((invitation) => {
                  const isExpired = new Date(invitation.expires_at) < new Date()
                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{invitation.email}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Invited: {new Date(invitation.created_at).toLocaleDateString()}
                          {invitation.inviter_name && ` by ${invitation.inviter_name}`}
                        </div>
                        {isExpired && (
                          <div className="text-xs text-red-600 mt-1">Expired</div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <select
                          value={invitation.role_id || ''}
                          onChange={(e) => handleUpdateRole('invitation', invitation.id, e.target.value)}
                          disabled={updating === invitation.id || isExpired}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          disabled={updating === invitation.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


