import { NextRequest, NextResponse } from 'next/server'

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

  // Build the environment variable key
  const envKey = billing === 'monthly' 
    ? `STRIPE_PRICE_ID_${plan}_MONTHLY`
    : `STRIPE_PRICE_ID_${plan}_ANNUAL`

  const priceId = process.env[envKey]

  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID not found for ${plan} ${billing}` },
      { status: 404 }
    )
  }

  return NextResponse.json({ priceId })
}
