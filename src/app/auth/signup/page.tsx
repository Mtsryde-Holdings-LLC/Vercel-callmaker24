'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Registration, 2: MFA Setup
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [mfaMethod, setMfaMethod] = useState<'sms' | 'email'>('sms')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (mfaMethod === 'sms' && !formData.phone) {
      setError('Phone number is required for SMS verification')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          mfaMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to create account'
        setError(errorMessage)
        setLoading(false)
        return
      }

      // Move to MFA verification step
      setStep(2)
      setLoading(false)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/verify-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid verification code')
        setLoading(false)
        return
      }

      // Auto sign in after MFA verification
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but failed to sign in. Please try signing in manually.')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/dashboard' })
  }

  const resendCode = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/resend-mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, method: mfaMethod }),
      })
      setError('Verification code resent!')
    } catch (err) {
      setError('Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-12">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Register</span>
            </div>
            <div className={`w-16 h-0.5 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>
                <ShieldCheckIcon className="w-5 h-5" />
              </div>
              <span className="ml-2 text-sm font-medium">Verify MFA</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Create Account' : 'Verify Your Identity'}
            </h1>
            <p className="text-gray-600">
              {step === 1 ? 'Start your journey with CallMaker24' : 'Enter the verification code sent to you'}
            </p>
          </div>

          {error && (
            <div className={`mb-4 p-3 ${error.includes('resent') ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'} border rounded-lg text-sm`}>
              {error}
            </div>
          )}

          {/* Step 1: Registration Form */}
          {step === 1 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              {/* MFA Method Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Multi-Factor Authentication</h3>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="mfaMethod"
                          value="sms"
                          checked={mfaMethod === 'sms'}
                          onChange={(e) => setMfaMethod(e.target.value as 'sms' | 'email')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">SMS Verification</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="mfaMethod"
                          value="email"
                          checked={mfaMethod === 'email'}
                          onChange={(e) => setMfaMethod(e.target.value as 'sms' | 'email')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Email Verification</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {mfaMethod === 'sms' && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              )}

              <div className="text-sm">
                <label className="flex items-start">
                  <input type="checkbox" required className="mr-2 mt-1 rounded border-gray-300" />
                  <span className="text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary-600 hover:text-primary-700">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary-600 hover:text-primary-700">
                      Privacy Policy
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Continue to Verification'}
              </button>
            </form>
          )}

          {/* Step 2: MFA Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyMFA} className="space-y-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
                </div>
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit verification code to:<br />
                  <span className="font-medium text-gray-900">
                    {mfaMethod === 'sms' ? formData.phone : formData.email}
                  </span>
                </p>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1 text-center">
                  Enter Verification Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Complete Registration'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                  Resend code
                </button>
                <span className="text-gray-400 mx-2">|</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-700 disabled:opacity-50"
                >
                  Go back
                </button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleOAuthSignIn('google')}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>

                  <button
                    onClick={() => handleOAuthSignIn('facebook')}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </button>
                </div>
              </div>

              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
