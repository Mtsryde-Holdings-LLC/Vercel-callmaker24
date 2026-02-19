'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
  lastLoginAt: string | null
}

export default function TeamPage() {
  const { data: session } = useSession()
  const { backgroundColor } = useTheme()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'AGENT' | 'SUB_ADMIN'>('AGENT')
  const [inviteName, setInviteName] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/team')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data || [])
      } else {
        console.error('Failed to fetch users: HTTP', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setInviteLoading(true)

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to invite user')
        setInviteLoading(false)
        return
      }

      setSuccess(`Successfully invited ${inviteEmail}!`)
      setInviteEmail('')
      setInviteName('')
      setShowInviteDialog(false)
      fetchUsers()
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return

    try {
      const response = await fetch(`/api/team/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('User removed successfully')
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to remove user')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'CORPORATE_ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'SUB_ADMIN':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'AGENT':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Super Admin'
      case 'CORPORATE_ADMIN':
        return 'Admin'
      case 'SUB_ADMIN':
        return 'Manager'
      case 'AGENT':
        return 'Agent'
      case 'SUBSCRIBER':
        return 'Subscriber'
      default:
        return role
    }
  }

  const canManageUsers = session?.user?.role === 'CORPORATE_ADMIN' || session?.user?.role === 'SUB_ADMIN' || session?.user?.role === 'SUPER_ADMIN'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Debug:</strong> User Role: {session?.user?.role || 'Not set'} | 
            Can Manage: {canManageUsers ? 'Yes' : 'No'}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">Manage your organization's users and agents</p>
        </div>
        <button
          onClick={() => setShowInviteDialog(true)}
          className="px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
        >
          <span className="text-xl">➕</span>
          <span className="font-semibold">Invite User</span>
        </button>
      </div>
      
      {/* Permission Notice */}
      {!canManageUsers && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
          <strong>Note:</strong> Only organization admins and managers can invite new team members. Contact your administrator if you need to add users.
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg">
          {success}
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading team members...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
            <p className="text-gray-600 mb-6">
              Start building your team by inviting agents and managers
            </p>
            {canManageUsers && (
              <button
                onClick={() => setShowInviteDialog(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Invite Your First User
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Last Login</th>
                  {canManageUsers && (
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{user.name || 'No name'}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    {canManageUsers && (
                      <td className="px-6 py-4 text-right">
                        {user.email !== session?.user?.email && (
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteDialog(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'AGENT' | 'SUB_ADMIN')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="AGENT">Agent - Can handle calls and customers</option>
                  <option value="SUB_ADMIN">Manager - Can manage agents and settings</option>
                </select>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {inviteLoading ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
