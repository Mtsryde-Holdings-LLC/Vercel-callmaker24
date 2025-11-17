'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

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

  if (status === 'loading') {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Your role: <span className="font-semibold">{session?.user?.role || 'SUBSCRIBER'}</span>
            </p>
          </div>
          <button
            onClick={makeMeSuperAdmin}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            Make Me Super Admin
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700">
            Click the "Make Me Super Admin" button above to elevate your role.
          </p>
        </div>
      </div>
    </div>
  )
}
