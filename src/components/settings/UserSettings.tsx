import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { updateName } from '@/lib/appwrite/auth'
import { updateUserName } from '@/lib/neon/users'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Settings, User, Lock, Bell, Trash2 } from 'lucide-react'

export function UserSettings() {
  const { user, refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [passwordUpdate, setPasswordUpdate] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleUpdateName = async () => {
    if (!user) return

    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setLoading(true)
    try {
      // Update in Appwrite
      await updateName(name)
      
      // Update in NeonDB
      await updateUserName(user.$id, name)
      
      // Refresh auth state
      await refresh()

      toast.success('Profile updated successfully', {
        description: 'Your name has been updated.',
      })
    } catch (error: any) {
      toast.error('Failed to update profile', {
        description: error.message || 'Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = () => {
    toast.info('Password reset', {
      description: 'Password reset functionality will redirect you to Appwrite. Please use the forgot password feature on the login page.',
    })
  }

  const handleDeleteAccount = () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    toast.error('Account deletion', {
      description: 'Account deletion is a sensitive operation. Please contact support for assistance.',
    })
  }

  if (!user) {
    return <div>Please log in to access settings</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          <CardTitle>Profile Information</CardTitle>
        </div>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter your full name"
          />
        </div>
        <Button
          onClick={handleUpdateName}
          disabled={loading || name === user.name}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </CardContent>
      </Card>

      {/* Password & Security */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-teal-600" />
            <CardTitle>Password & Security</CardTitle>
          </div>
          <CardDescription>Manage your password and security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              To reset your password, please use the "Forgot Password" feature on the login page.
            </p>
            <Button
              variant="outline"
              onClick={handlePasswordReset}
              className="w-full sm:w-auto"
            >
              Reset Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <CardTitle>Preferences</CardTitle>
          </div>
          <CardDescription>Customize your experience</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Notification and theme preferences will be available soon.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="glass-card border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Delete Account</h3>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

