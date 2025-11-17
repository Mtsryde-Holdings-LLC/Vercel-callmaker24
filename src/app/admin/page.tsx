'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [verificationCode, setVerificationCode] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const makeMeSuperAdmin = async () => {
    if (!showCodeInput) {
      setShowCodeInput(true)
      return
    }

    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    try {
      const res = await fetch('/api/admin/make-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || data.error || 'Failed to set super admin')
        return
      }

      alert('You are now SUPER_ADMIN! Please sign out and sign back in.')
      window.location.href = '/auth/signin'
    } catch (err: any) {
      setError(err.message || 'An error occurred')
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
          {!showCodeInput ? (
            <button
              onClick={makeMeSuperAdmin}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-lg"
            >
              Request Super Admin Access
            </button>
          ) : null}
        </div>

        {showCodeInput && (
          <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Super Admin Verification</h2>
            <p className="text-gray-600 mb-6">
              Contact <a href="mailto:emmanuel.o@mtsryde.com" className="text-purple-600 hover:underline font-semibold">emmanuel.o@mtsryde.com</a> to obtain the verification code.
            </p>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter verification code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={makeMeSuperAdmin}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  Verify & Activate
                </button>
                <button
                  onClick={() => {
                    setShowCodeInput(false)
                    setVerificationCode('')
                    setError('')
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {!showCodeInput && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-700">
              Click "Request Super Admin Access" to elevate your role. You will need a verification code from the administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
