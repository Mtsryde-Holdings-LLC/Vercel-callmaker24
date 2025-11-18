'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Subscription {
  id: string
  plan: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  emailCredits: number
  smsCredits: number
  aiCredits: number
  emailUsed: number
  smsUsed: number
  aiUsed: number
  invoices: Array<{
    id: string
    amount: number
    currency: string
    status: string
    invoiceUrl: string | null
    paidAt: string | null
  }>
}

interface PricingPlan {
  name: string
  price: string
  priceId: string
  features: string[]
  popular?: boolean
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Basic',
    price: '$29',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC || 'price_basic',
    features: [
      '5,000 emails/month',
      '500 SMS messages/month',
      '100 AI credits/month',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '$99',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO || 'price_pro',
    features: [
      '50,000 emails/month',
      '5,000 SMS messages/month',
      '1,000 AI credits/month',
      'Advanced analytics',
      'Priority support',
      'Custom templates',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$299',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE || 'price_enterprise',
    features: [
      '500,000 emails/month',
      '50,000 SMS messages/month',
      '10,000 AI credits/month',
      'Advanced analytics',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
    ],
  },
]

export default function BillingTab() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSubscription()

    // Check for success/cancel params
    const success = searchParams?.get('success')
    const canceled = searchParams?.get('canceled')
    
    if (success === 'true') {
      setMessage('Subscription created successfully!')
      // Clear the URL params
      router.replace('/dashboard/settings?tab=billing')
    } else if (canceled === 'true') {
      setMessage('Checkout was canceled.')
      router.replace('/dashboard/settings?tab=billing')
    }
  }, [searchParams, router])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions/current')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    setActionLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      if (response.ok) {
        const { url } = await response.json()
        if (url) {
          window.location.href = url
        }
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to create checkout session')
      }
    } catch (error) {
      setMessage('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setActionLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        if (url) {
          window.location.href = url
        }
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to open customer portal')
      }
    } catch (error) {
      setMessage('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
      return
    }

    setActionLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately: false }),
      })

      if (response.ok) {
        setMessage('Subscription will be cancelled at the end of the billing period')
        fetchSubscription()
      } else {
        const error = await response.json()
        setMessage(error.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      setMessage('An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const currentPlan = subscription?.plan || 'FREE'
  const hasActiveSubscription = subscription && subscription.status === 'ACTIVE' && currentPlan !== 'FREE'

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('success') || message.includes('created') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      {/* Current Subscription */}
      {hasActiveSubscription && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Subscription</h2>
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentPlan} Plan</h3>
                <p className="text-gray-600">
                  {subscription.currentPeriodEnd && (
                    <>Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                subscription.cancelAtPeriodEnd 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {subscription.cancelAtPeriodEnd ? 'Canceling' : 'Active'}
              </span>
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">Email Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.emailCredits - subscription.emailUsed}
                </p>
                <p className="text-xs text-gray-500">of {subscription.emailCredits} remaining</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">SMS Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.smsCredits - subscription.smsUsed}
                </p>
                <p className="text-xs text-gray-500">of {subscription.smsCredits} remaining</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm text-gray-600">AI Credits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.aiCredits - subscription.aiUsed}
                </p>
                <p className="text-xs text-gray-500">of {subscription.aiCredits} remaining</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleManageSubscription}
                disabled={actionLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                Manage Subscription
              </button>
              {!subscription.cancelAtPeriodEnd && (
                <button
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {hasActiveSubscription ? 'Change Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={`border rounded-lg p-6 ${
                plan.popular
                  ? 'border-primary-500 shadow-lg relative'
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 text-xs font-medium rounded-bl-lg rounded-tr-lg">
                  Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={actionLoading || currentPlan === plan.name.toUpperCase()}
                className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                  currentPlan === plan.name.toUpperCase()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.popular
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-white border border-primary-600 text-primary-600 hover:bg-primary-50'
                } disabled:opacity-50`}
              >
                {currentPlan === plan.name.toUpperCase() ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      {subscription?.invoices && subscription.invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {subscription.invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.paidAt && new Date(invoice.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invoice.invoiceUrl && (
                        <a
                          href={invoice.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
