import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Accept policy endpoint
 * Marks user as having accepted the acceptable use policy
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update user to mark policy as accepted
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        policyAccepted: true,
        policyAcceptedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Policy accepted successfully',
    })
  } catch (error) {
    console.error('Policy acceptance error:', error)
    return NextResponse.json(
      {
        error: 'Failed to accept policy',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Check policy acceptance status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        policyAccepted: true,
        policyAcceptedAt: true,
      },
    })

    return NextResponse.json({
      accepted: user?.policyAccepted || false,
      acceptedAt: user?.policyAcceptedAt,
    })
  } catch (error) {
    console.error('Policy check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check policy status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
