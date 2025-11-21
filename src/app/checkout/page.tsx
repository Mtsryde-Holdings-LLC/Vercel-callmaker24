'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/config/subscriptions'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ priceId, planName, amount, billingPeriod }: { 
  priceId: string
  planName: string
  amount: number
  billingPeriod: string
}) {
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

      router.push('/dashboard?message=Subscription activated successfully!')
      
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{planName} Plan</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-blue-600">${amount.toFixed(2)}</span>
          <span className="text-gray-600">/ {billingPeriod === 'monthly' ? 'month' : 'year'}</span>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <label className="block text-sm font-medium mb-3 text-gray-700">Card Details</label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
                padding: '12px',
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
        <p className="font-medium mb-2">💳 Test Card (Development):</p>
        <p>Card: <code className="bg-white px-2 py-1 rounded">4242 4242 4242 4242</code></p>
        <p>Expiry: Any future date (e.g., 12/25)</p>
        <p>CVC: Any 3 digits (e.g., 123)</p>
        <p>ZIP: Any 5 digits (e.g., 12345)</p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg"
      >
        {loading ? 'Processing...' : `Subscribe to ${planName}`}
      </button>

      <p className="text-center text-sm text-gray-500">
        🔒 Secure payment powered by Stripe
      </p>
    </form>
  )
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const plan = searchParams.get('plan') as SubscriptionTier | null
  const billingPeriod = searchParams.get('billing') || 'monthly'
  const [priceId, setPriceId] = useState<string | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/checkout')
      return
    }
    
    if (plan && billingPeriod && status === 'authenticated') {
      fetch(`/api/get-price-id?plan=${plan}&billing=${billingPeriod}`)
        .then(res => res.json())
        .then(data => {
          if (data.priceId) {
            setPriceId(data.priceId)
          } else {
            console.error('No price ID returned:', data)
          }
        })
        .catch(err => console.error('Failed to fetch price ID:', err))
        .finally(() => setLoadingPrice(false))
    } else if (status === 'authenticated') {
      setLoadingPrice(false)
    }
  }, [plan, billingPeriod, status, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/checkout')
    }
  }, [status, router])

  if (status === 'loading' || loadingPrice) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || !plan || !priceId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Checkout</h2>
          <p className="text-gray-600 mb-6">
            {!session ? 'Please sign in to continue.' : `Missing: ${!plan ? 'plan' : ''} ${!priceId ? 'priceId' : ''}`}
          </p>
          <div className="text-xs text-gray-500 mb-4">
            Debug: session={session ? 'yes' : 'no'}, plan={plan || 'none'}, priceId={priceId || 'none'}
          </div>
          <button
            onClick={() => router.push(!session ? '/auth/signin' : '/auth/signup')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            {!session ? 'Go to Sign In' : 'Go to Signup'}
          </button>
        </div>
      </div>
    )
  }

  const planDetails = SUBSCRIPTION_PLANS[plan]
  if (!planDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Plan</h2>
          <p className="text-gray-600 mb-6">The selected plan is not valid.</p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Go to Signup
          </button>
        </div>
      </div>
    )
  }
  const amount = billingPeriod === 'monthly' ? planDetails.monthlyPrice : planDetails.annualPrice

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Subscription</h1>
          <p className="text-gray-600">Enter your payment details to get started</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <Elements stripe={stripePromise}>
            <CheckoutForm
              priceId={priceId}
              planName={planDetails.name}
              amount={amount}
              billingPeriod={billingPeriod}
            />
          </Elements>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
