'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  email: string | null
  name: string | null
  role: string
  organizationId: string | null
  organization?: { name: string } | null
  assignedBy: string | null
  permissions: any
  createdAt: string
  lastLoginAt: string | null
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (session?.user) {
      fetchUsers()
    }
  }, [status, session])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }
      const data = await res.json()
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: newRole,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update role')
      }

      alert('Role updated successfully')
      setSelectedUser(null)
      setNewRole('')
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const makeMeSuperAdmin = async () => {
    if (!confirm('Make yourself SUPER_ADMIN?')) return

    try {
      const res = await fetch('/api/admin/make-super-admin', {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to set super admin')
      }

      alert('You are now SUPER_ADMIN! Please refresh the page.')
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN'
  const isCorporateAdmin = session?.user?.role === 'CORPORATE_ADMIN'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Your role: <span className="font-semibold">{session?.user?.role}</span>
            </p>
          </div>
          <div className="flex gap-4">
            {!isSuperAdmin && (
              <button
                onClick={makeMeSuperAdmin}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Make Me Super Admin
              </button>
            )}
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                {isSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'CORPORATE_ADMIN' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'SUB_ADMIN' ? 'bg-green-100 text-green-800' :
                      user.role === 'AGENT' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.organization?.name || 'No org'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {(isSuperAdmin || (isCorporateAdmin && user.role !== 'SUPER_ADMIN')) && (
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setNewRole(user.role)
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Change Role
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Role Change Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Change User Role</h2>
              <p className="text-gray-600 mb-4">
                User: {selectedUser.email}
              </p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-4"
              >
                <option value="">Select Role</option>
                {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                {isSuperAdmin && <option value="CORPORATE_ADMIN">Corporate Admin</option>}
                <option value="SUB_ADMIN">Sub Admin</option>
                <option value="AGENT">Agent</option>
                <option value="SUBSCRIBER">Subscriber</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleRoleChange}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Role
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setNewRole('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
