import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/subscriptions/current
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        subscriptions: {
          include: {
            invoices: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subscription = user.subscriptions[0]

    if (!subscription) {
      return NextResponse.json({
        plan: 'FREE',
        status: 'ACTIVE',
        emailCredits: 0,
        smsCredits: 0,
        aiCredits: 0,
        invoices: [],
      })
    }

    return NextResponse.json({
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      emailCredits: subscription.emailCredits,
      smsCredits: subscription.smsCredits,
      aiCredits: subscription.aiCredits,
      emailUsed: subscription.emailUsed,
      smsUsed: subscription.smsUsed,
      aiUsed: subscription.aiUsed,
      invoices: subscription.invoices,
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription' },
      { status: 500 }
    )
  }
}
