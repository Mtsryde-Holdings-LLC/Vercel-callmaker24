'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

export default function AdminAccessPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null)
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)

  useEffect(() => {
    // Auto-setup admin account on page load
    setupAdminAccount()
  }, [])

  // Auto-login immediately after credentials are available
  useEffect(() => {
    if (credentials && !loading && !autoLoginAttempted) {
      // Auto-trigger login after short delay
      const timer = setTimeout(() => {
        handleAutoLogin()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [credentials, loading, autoLoginAttempted])

  const setupAdminAccount = async () => {
    try {
      const response = await fetch('/api/auth/superadmin', {
        method: 'GET',
      })

      const data = await response.json()

      if (response.ok) {
        setCredentials(data.credentials)
        setMessage('Super admin account is ready!')
      } else {
        setMessage(data.error || 'Failed to setup admin account')
      }
    } catch (error) {
      setMessage('Error setting up admin account')
      console.error('Setup error:', error)
    }
  }

  const handleAutoLogin = async () => {
    if (!credentials) {
      setMessage('Please wait for account setup...')
      return
    }

    setLoading(true)
    setAutoLoginAttempted(true)
    setMessage('Logging in as Super Admin...')

    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (result?.error) {
        setMessage(`Login failed: ${result.error}`)
        setLoading(false)
      } else if (result?.ok) {
        setMessage('✓ Login successful! Redirecting to dashboard...')
        // Immediate redirect
        window.location.href = '/dashboard'
      }
    } catch (error) {
      setMessage('An error occurred during login')
      setLoading(false)
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-200">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <ShieldCheckIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Super Admin Access
            </h1>
            <p className="text-sm text-gray-600">
              Bypass signup and login directly with admin privileges
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.includes('successful') || message.includes('ready')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : message.includes('failed') || message.includes('Error')
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-blue-50 text-blue-800 border border-blue-200'
              }`}
            >
              {message}
            </div>
          )}

          {/* Credentials Display */}
          {credentials && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Admin Credentials:
              </h3>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Email:</label>
                  <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border">
                    {credentials.email}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Password:</label>
                  <p className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded border">
                    {credentials.password}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {loading ? (
              <div className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging you in...
              </div>
            ) : (
              <>
                <button
                  onClick={handleAutoLogin}
                  disabled={!credentials}
                  className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Login as Super Admin
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>

                <button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition"
                >
                  Go to Regular Sign In
                </button>
              </>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-900 mb-2">
              ⚠️ Security Notice
            </h4>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>• This bypasses MFA verification</li>
              <li>• Grants full SUPER_ADMIN privileges</li>
              <li>• Only enabled in development mode</li>
              <li>• Change credentials in production</li>
            </ul>
          </div>

          {/* Manual Login Option */}
          {autoLoginAttempted && !loading && (
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 mb-2">
                Auto-login not working? Try manual login:
              </p>
              <a
                href="/auth/signin"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Sign In Manually →
              </a>
            </div>
          )}
        </div>

        {/* Development Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Access this page anytime at:{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">/admin-access</code>
          </p>
        </div>
      </div>
    </div>
  )
}
