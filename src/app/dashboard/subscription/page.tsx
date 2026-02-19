'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { SUBSCRIPTION_PLANS, type SubscriptionTier, type BillingPeriod } from '@/config/subscriptions'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ─── Billing Provider Info ────────────────────────────────────────────────────
interface BillingProviderInfo {
  provider: 'shopify' | 'stripe'
  shopifyShop: string | null
  isShopifyMerchant: boolean
  hasActiveSubscription: boolean
  currentPlan: string
  currentStatus: string
  billingProvider: string | null
  shopifyChargeId: string | null
}

// ─── Stripe Checkout Form (non-Shopify users only) ───────────────────────────
function StripeCheckoutForm({ priceId, planName, amount }: { priceId: string; planName: string; amount: number }) {
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

      if (data.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(data.clientSecret)
        if (confirmError) {
          throw new Error(confirmError.message)
        }
      }

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

// ─── Shopify Checkout Form (Shopify merchants — required by App Store) ───────
function ShopifyCheckoutForm({
  plan,
  planName,
  amount,
  billingPeriod,
}: {
  plan: SubscriptionTier
  planName: string
  amount: number
  billingPeriod: BillingPeriod
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShopifyCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/integrations/shopify/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billingPeriod }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Shopify billing charge')
      }

      if (data.data?.confirmationUrl) {
        // Redirect to Shopify for merchant approval (required by App Store)
        window.location.href = data.data.confirmationUrl
      } else {
        throw new Error('No confirmation URL received from Shopify')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Subscribe to {planName}</h3>
        <p className="text-2xl font-bold text-blue-600">${amount.toFixed(2)}</p>
        <p className="text-sm text-gray-500 mt-1">
          {billingPeriod === 'annual' ? 'Annual billing' : 'Monthly billing'}
        </p>
      </div>

      {/* Shopify Billing Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5,2.1C14.2,1.5,13,2.1,12.6,2.4c-0.1,0.1-0.2,0.1-0.3,0c-0.6-0.5-1.7-1-3-0.4C7.7,2.7,7.2,4.4,7.5,5.7 c0,0,0,0.1,0,0.1c-0.2,0-0.3,0-0.5,0c-1.5,0.1-2.3,1-2.3,2.4c0,0.8,0,14.2,0,14.2c0,0.8,0.7,1.5,1.5,1.5h12.7 c0.8,0,1.5-0.7,1.5-1.5V8.3c0-0.8-0.3-1.4-0.8-1.8c-0.3-0.3-0.7-0.4-1.2-0.5c0,0,0-0.1,0-0.1C18.8,4.4,17.3,2.8,15.5,2.1z"/>
          </svg>
          <div>
            <p className="font-semibold text-green-800">Shopify Billing</p>
            <p className="text-sm text-green-700 mt-1">
              As a Shopify merchant, your subscription is managed through Shopify&apos;s billing system.
              You&apos;ll be redirected to Shopify to approve the charge. The subscription will appear on your Shopify invoice.
            </p>
          </div>
        </div>
      </div>

      {/* What's included summary */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-medium mb-2">Your subscription includes:</p>
        <ul className="space-y-1">
          <li>• 30-day free trial</li>
          <li>• Billed through your Shopify account</li>
          <li>• Cancel anytime from your Shopify admin</li>
          <li>• Charges appear on your Shopify invoice</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <button
        onClick={handleShopifyCheckout}
        disabled={loading}
        className="w-full bg-[#96bf48] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#7da83e] disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting to Shopify...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5,2.1C14.2,1.5,13,2.1,12.6,2.4c-0.1,0.1-0.2,0.1-0.3,0c-0.6-0.5-1.7-1-3-0.4C7.7,2.7,7.2,4.4,7.5,5.7 c0,0,0,0.1,0,0.1c-0.2,0-0.3,0-0.5,0c-1.5,0.1-2.3,1-2.3,2.4c0,0.8,0,14.2,0,14.2c0,0.8,0.7,1.5,1.5,1.5h12.7 c0.8,0,1.5-0.7,1.5-1.5V8.3c0-0.8-0.3-1.4-0.8-1.8c-0.3-0.3-0.7-0.4-1.2-0.5c0,0,0-0.1,0-0.1C18.8,4.4,17.3,2.8,15.5,2.1z"/>
            </svg>
            Subscribe via Shopify
          </>
        )}
      </button>
    </div>
  )
}

// ─── Active Subscription Status Banner ───────────────────────────────────────
function ActiveSubscriptionBanner({
  billingInfo,
  onManage,
}: {
  billingInfo: BillingProviderInfo
  onManage: () => void
}) {
  const isShopify = billingInfo.billingProvider === 'shopify'
  const planConfig = SUBSCRIPTION_PLANS[billingInfo.currentPlan as SubscriptionTier]

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Current Plan: {planConfig?.name || billingInfo.currentPlan}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              billingInfo.currentStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              billingInfo.currentStatus === 'TRIALING' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {billingInfo.currentStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Billed through {isShopify ? 'Shopify' : 'Stripe'}
            {isShopify && ' (Shopify App Store)'}
          </p>
        </div>
        <button
          onClick={onManage}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
        >
          {isShopify ? 'Manage in Shopify Admin' : 'Change Plan'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Subscription Page ─────────────────────────────────────────────────
export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('ELITE')
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const [showCheckout, setShowCheckout] = useState(false)
  const [billingInfo, setBillingInfo] = useState<BillingProviderInfo | null>(null)
  const [billingLoading, setBillingLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Detect billing provider on mount
  const fetchBillingProvider = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/provider')
      if (response.ok) {
        const data = await response.json()
        setBillingInfo(data.data)
      }
    } catch {
      // Default to Stripe if detection fails
      setBillingInfo({
        provider: 'stripe',
        shopifyShop: null,
        isShopifyMerchant: false,
        hasActiveSubscription: false,
        currentPlan: 'FREE',
        currentStatus: 'ACTIVE',
        billingProvider: null,
        shopifyChargeId: null,
      })
    } finally {
      setBillingLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
    if (status === 'authenticated') {
      fetchBillingProvider()
    }
  }, [status, router, fetchBillingProvider])

  // Handle Shopify billing callback success/error
  useEffect(() => {
    const shopifyBilling = searchParams?.get('shopify_billing')
    const plan = searchParams?.get('plan')
    const error = searchParams?.get('error')

    if (shopifyBilling === 'success' && plan) {
      setSuccessMessage(`Successfully subscribed to the ${SUBSCRIPTION_PLANS[plan as SubscriptionTier]?.name || plan} plan via Shopify!`)
      fetchBillingProvider()
    }
    if (error) {
      setSuccessMessage(null)
    }
  }, [searchParams, fetchBillingProvider])

  if (status === 'loading' || billingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isShopifyMerchant = billingInfo?.provider === 'shopify'
  const plans = Object.entries(SUBSCRIPTION_PLANS) as [SubscriptionTier, typeof SUBSCRIPTION_PLANS[SubscriptionTier]][]
  const currentPlan = SUBSCRIPTION_PLANS[selectedPlan]
  const priceId = process.env[`NEXT_PUBLIC_STRIPE_PRICE_ID_${selectedPlan}_${billingPeriod.toUpperCase()}`] || 
                  (billingPeriod === 'monthly' 
                    ? process.env[`NEXT_PUBLIC_STRIPE_PRICE_ID_${selectedPlan}_MONTHLY`]
                    : process.env[`NEXT_PUBLIC_STRIPE_PRICE_ID_${selectedPlan}_ANNUAL`])

  // ─── Checkout View ──────────────────────────────────────────────────────────
  if (showCheckout) {
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
            {isShopifyMerchant ? (
              /* Shopify merchants MUST use Shopify Billing (App Store requirement) */
              <ShopifyCheckoutForm
                plan={selectedPlan}
                planName={currentPlan.name}
                amount={billingPeriod === 'monthly' ? currentPlan.monthlyPrice : currentPlan.annualPrice}
                billingPeriod={billingPeriod}
              />
            ) : priceId ? (
              /* Non-Shopify users use Stripe */
              <Elements stripe={stripePromise}>
                <StripeCheckoutForm
                  priceId={priceId}
                  planName={currentPlan.name}
                  amount={billingPeriod === 'monthly' ? currentPlan.monthlyPrice : currentPlan.annualPrice}
                />
              </Elements>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Payment system is being configured. Please try again later.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Plan Selection View ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Success message from Shopify callback */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-green-800">{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-600 hover:text-green-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Active subscription banner */}
        {billingInfo?.hasActiveSubscription && billingInfo.currentPlan !== 'FREE' && (
          <ActiveSubscriptionBanner
            billingInfo={billingInfo}
            onManage={() => {
              if (billingInfo.billingProvider === 'shopify' && billingInfo.shopifyChargeId) {
                // Shopify merchants manage billing in Shopify admin
                window.open(`https://${billingInfo.shopifyShop}/admin/settings/billing`, '_blank')
              } else {
                setShowCheckout(true)
              }
            }}
          />
        )}

        {/* Shopify merchant billing notice */}
        {isShopifyMerchant && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5,2.1C14.2,1.5,13,2.1,12.6,2.4c-0.1,0.1-0.2,0.1-0.3,0c-0.6-0.5-1.7-1-3-0.4C7.7,2.7,7.2,4.4,7.5,5.7 c0,0,0,0.1,0,0.1c-0.2,0-0.3,0-0.5,0c-1.5,0.1-2.3,1-2.3,2.4c0,0.8,0,14.2,0,14.2c0,0.8,0.7,1.5,1.5,1.5h12.7 c0.8,0,1.5-0.7,1.5-1.5V8.3c0-0.8-0.3-1.4-0.8-1.8c-0.3-0.3-0.7-0.4-1.2-0.5c0,0,0-0.1,0-0.1C18.8,4.4,17.3,2.8,15.5,2.1z"/>
            </svg>
            <div>
              <p className="font-semibold text-emerald-800">Shopify App Store Billing</p>
              <p className="text-sm text-emerald-700 mt-1">
                Your Shopify store is connected. All subscription charges will be processed through Shopify&apos;s billing
                system and will appear on your Shopify invoice. This is required by the Shopify App Store.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Start with a 30-day free trial. Cancel anytime.
          </p>
          <div className="inline-block bg-green-100 text-green-800 px-6 py-2 rounded-full font-semibold mb-8">
            🎉 30 Days Free Trial - No Credit Card Required
          </div>

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
            className={`px-12 py-4 rounded-lg text-lg font-semibold transition shadow-lg ${
              isShopifyMerchant
                ? 'bg-[#96bf48] text-white hover:bg-[#7da83e]'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isShopifyMerchant ? 'Subscribe via Shopify' : 'Start 30-Day Free Trial'}
          </button>
          <p className="mt-4 text-sm text-gray-600">
            {isShopifyMerchant
              ? 'Billed through Shopify • 30-day free trial • Cancel anytime'
              : 'No credit card required • Cancel anytime • Full access during trial'}
          </p>
        </div>
      </div>
    </div>
  )
}
