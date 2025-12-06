'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { SUBSCRIPTION_PLANS, type SubscriptionTier, type BillingPeriod } from '@/config/subscriptions'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ priceId, planName, amount }: { priceId: string; planName: string; amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create payment method
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (pmError) {
        throw new Error(pmError.message)
      }

      // Create subscription
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          paymentMethodId: paymentMethod.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Handle payment confirmation if needed
      if (data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret)
        
        if (confirmError) {
          throw new Error(confirmError.message)
        }
      }

      // Success!
      alert('Subscription created successfully!')
      router.push('/dashboard')
      
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Subscribe to {planName}</h3>
        <p className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</p>
      </div>

      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Test Card:</p>
        <p>Card: 4242 4242 4242 4242</p>
        <p>Expiry: Any future date</p>
        <p>CVC: Any 3 digits</p>
        <p>ZIP: Any 5 digits</p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>
    </form>
  )
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('ELITE')
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [showCheckout, setShowCheckout] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return null
  }

  const plans = Object.entries(SUBSCRIPTION_PLANS) as [SubscriptionTier, typeof SUBSCRIPTION_PLANS[SubscriptionTier]][]
  const currentPlan = SUBSCRIPTION_PLANS[selectedPlan]
  const priceId = process.env[`NEXT_PUBLIC_STRIPE_PRICE_ID_${selectedPlan}_${billingPeriod.toUpperCase()}`] || 
                  (billingPeriod === 'monthly' 
                    ? process.env[`NEXT_PUBLIC_STRIPE_PRICE_ID_${selectedPlan}_MONTHLY`]
                    : process.env[`NEXT_PUBLIC_STRIPE_PRICE_ID_${selectedPlan}_ANNUAL`])

  if (showCheckout && priceId) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setShowCheckout(false)}
            className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            ← Back to plans
          </button>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <Elements stripe={stripePromise}>
              <CheckoutForm
                priceId={priceId}
                planName={currentPlan.name}
                amount={billingPeriod === 'monthly' ? currentPlan.monthlyPrice : currentPlan.annualPrice}
              />
            </Elements>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Start with a 30-day free trial. Cancel anytime.
          </p>

          {/* Billing Period Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full font-medium transition ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map(([tier, plan]) => {
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const isSelected = selectedPlan === tier

            return (
              <div
                key={tier}
                onClick={() => setSelectedPlan(tier)}
                className={`relative bg-white rounded-xl shadow-lg p-6 cursor-pointer transition transform hover:scale-105 ${
                  isSelected ? 'ring-4 ring-blue-500' : ''
                } ${plan.popular ? 'border-2 border-blue-500 mt-4' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <span className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-blue-600">
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-gray-600">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>

                  <ul className="space-y-2 mb-6 text-left text-xs">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.features.maxAgents === -1 ? 'Unlimited' : plan.features.maxAgents} agents
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.features.maxCustomers === -1 ? 'Unlimited' : plan.features.maxCustomers.toLocaleString()} customers
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.features.maxEmailsPerMonth === -1 ? 'Unlimited' : plan.features.maxEmailsPerMonth.toLocaleString()} emails/mo
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.features.maxSMSPerMonth === -1 ? 'Unlimited' : plan.features.maxSMSPerMonth.toLocaleString()} SMS/mo
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.features.maxVoiceMinutesPerMonth === -1 ? 'Unlimited' : plan.features.maxVoiceMinutesPerMonth.toLocaleString()} voice min/mo
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {plan.features.maxSocialAccounts === -1 ? 'Unlimited' : plan.features.maxSocialAccounts} social accounts
                    </li>
                    {plan.features.aiChatbot && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        AI Chatbot
                      </li>
                    )}
                    {plan.features.loyaltyProgram && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Loyalty Program
                      </li>
                    )}
                    {plan.features.shopifyIntegration && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Shopify Integration
                      </li>
                    )}
                    {plan.features.prioritySupport && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Priority Support
                      </li>
                    )}
                    {plan.features.dedicatedAccountManager && (
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Dedicated Manager
                      </li>
                    )}
                  </ul>

                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-50 bg-opacity-20 rounded-xl pointer-events-none"></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Checkout Button */}
        <div className="text-center">
          <button
            onClick={() => setShowCheckout(true)}
            className="bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
          >
            Continue to Payment
          </button>
          <p className="mt-4 text-sm text-gray-600">
            30-day free trial • No credit card required for trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
