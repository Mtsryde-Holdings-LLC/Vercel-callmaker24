import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PaymentService } from '@/services/payment.service'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { priceId, paymentMethodId } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    const result = await PaymentService.createSubscription(
      session.user.id,
      priceId,
      paymentMethodId
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
