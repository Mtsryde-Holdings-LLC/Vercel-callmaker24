'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ShieldCheckIcon, ScaleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function PolicyAcceptancePage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAccept = async () => {
    if (!agreed) {
      setError('You must agree to the terms to continue')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/accept-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        // Update session
        await update()
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to accept policy')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <ScaleIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Acceptable Use Policy
            </h1>
            <p className="text-gray-600">
              Please review and accept our platform usage policy to continue
            </p>
          </div>

          {/* Policy Content */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto border border-gray-200">
            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <ShieldCheckIcon className="w-6 h-6 mr-2 text-blue-600" />
                  Lawful Use Commitment
                </h2>
                <p className="mb-3">
                  By using CallMaker24, you hereby attest and agree that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You will use this platform solely for <strong>lawful purposes</strong></li>
                  <li>You will comply with all applicable local, state, and federal laws</li>
                  <li>You will not engage in any fraudulent, deceptive, or misleading practices</li>
                  <li>You will respect the rights and privacy of all individuals</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Customer Contact Compliance
                </h2>
                <p className="mb-3">
                  You agree that you will <strong>only contact customers who have explicitly subscribed</strong> to receive communications from you, and that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All contacts have provided prior express written consent</li>
                  <li>You maintain documented proof of consent for all contacts</li>
                  <li>You honor all opt-out and unsubscribe requests immediately</li>
                  <li>You comply with the Telephone Consumer Protection Act (TCPA)</li>
                  <li>You comply with the CAN-SPAM Act for email communications</li>
                  <li>You comply with all state-specific telemarketing laws</li>
                  <li>You maintain an up-to-date Do Not Call list compliance</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Federal & State Law Compliance
                </h2>
                <p className="mb-3">
                  You acknowledge and agree to comply with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Telephone Consumer Protection Act (TCPA)</strong> - Regulates telemarketing calls, auto-dialed calls, prerecorded calls, text messages, and unsolicited fax advertisements</li>
                  <li><strong>CAN-SPAM Act</strong> - Sets rules for commercial email, establishes requirements for commercial messages, and gives recipients the right to stop emails</li>
                  <li><strong>Federal Trade Commission (FTC) Regulations</strong> - Prohibits deceptive or unfair business practices</li>
                  <li><strong>State Telemarketing Laws</strong> - Various state-specific regulations that may be more restrictive than federal law</li>
                  <li><strong>Do Not Call Registry</strong> - Respect for national and state Do Not Call lists</li>
                  <li><strong>SMS/Text Message Compliance</strong> - CTIA guidelines and carrier regulations for text messaging</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Prohibited Activities
                </h2>
                <p className="mb-3">
                  You agree NOT to use this platform for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Unsolicited marketing or spam communications</li>
                  <li>Contacting individuals on Do Not Call lists</li>
                  <li>Fraudulent or deceptive marketing schemes</li>
                  <li>Harassment or threatening communications</li>
                  <li>Distribution of malware, viruses, or harmful content</li>
                  <li>Impersonation of other individuals or entities</li>
                  <li>Any activity that violates applicable laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Consent Management
                </h2>
                <p className="mb-3">
                  You are solely responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Obtaining and documenting proper consent before contacting customers</li>
                  <li>Maintaining accurate records of consent for each contact</li>
                  <li>Providing clear opt-out mechanisms in all communications</li>
                  <li>Processing opt-out requests within legally required timeframes</li>
                  <li>Keeping your contact lists current and compliant</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Account Suspension & Termination
                </h2>
                <p className="mb-3">
                  CallMaker24 reserves the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Suspend or terminate accounts that violate this policy</li>
                  <li>Report violations to appropriate authorities</li>
                  <li>Cooperate with law enforcement investigations</li>
                  <li>Take legal action against users who violate applicable laws</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Your Responsibility
                </h2>
                <p className="mb-3">
                  You acknowledge that you are solely responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Understanding and complying with all applicable laws</li>
                  <li>All content sent through the platform</li>
                  <li>All legal consequences of your use of the platform</li>
                  <li>Consulting with legal counsel if you have questions about compliance</li>
                </ul>
              </section>

              <section className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  ⚠️ Important Notice
                </h3>
                <p className="text-yellow-800">
                  Violations of the TCPA can result in fines of <strong>$500 to $1,500 per violation</strong>. 
                  Violations of the CAN-SPAM Act can result in penalties of up to <strong>$46,517 per email</strong>. 
                  You are personally liable for ensuring compliance with all applicable laws.
                </p>
              </section>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Acceptance Checkbox */}
          <div className="mb-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 mr-3 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I have read, understood, and agree to comply with this Acceptable Use Policy. 
                I attest that I will use CallMaker24 only for lawful purposes and will only contact 
                customers who have explicitly subscribed to receive communications from me, in full 
                compliance with all applicable federal and state laws including the TCPA, CAN-SPAM Act, 
                and all state-specific regulations.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleAccept}
              disabled={!agreed || loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  I Accept - Continue to Dashboard
                </>
              )}
            </button>
            <Link
              href="/auth/signout"
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition text-center"
            >
              I Do Not Accept - Sign Out
            </Link>
          </div>

          {/* Additional Links */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Questions about this policy?{' '}
              <Link href="/contact" className="text-blue-600 hover:text-blue-700">
                Contact our compliance team
              </Link>
            </p>
            <p className="mt-2">
              Review our{' '}
              <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </Link>
              {' and '}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
