import { NextRequest, NextResponse } from 'next/server'
import { getStripePriceId, isValidSubscriptionTier, type SubscriptionTier, type BillingPeriod } from '@/config/subscriptions'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const plan = searchParams.get('plan')
  const billing = searchParams.get('billing')

  if (!plan || !billing) {
    return NextResponse.json(
      { error: 'Plan and billing period are required' },
      { status: 400 }
    )
  }

  // Validate plan and billing period
  if (!isValidSubscriptionTier(plan)) {
    return NextResponse.json(
      { error: `Invalid subscription tier: ${plan}` },
      { status: 400 }
    )
  }

  if (billing !== 'monthly' && billing !== 'annual') {
    return NextResponse.json(
      { error: 'Billing period must be either "monthly" or "annual"' },
      { status: 400 }
    )
  }

  // Get price ID using the helper function that properly references env vars
  const priceId = getStripePriceId(plan as SubscriptionTier, billing as BillingPeriod)

  if (!priceId) {
    return NextResponse.json(
      { 
        error: `Price ID not configured for ${plan} ${billing}`,
        hint: `Please set NEXT_PUBLIC_STRIPE_PRICE_ID_${plan}_${billing.toUpperCase()} in your environment variables`
      },
      { status: 404 }
    )
  }

  return NextResponse.json({ priceId })
}
