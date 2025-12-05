import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tiers = await prisma.loyaltyTier.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { minPoints: 'asc' }
    })

    return NextResponse.json({ success: true, data: tiers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    const tier = await prisma.loyaltyTier.create({
      data: {
        name: body.name,
        tier: body.tier,
        minPoints: body.minPoints,
        pointsPerDollar: body.pointsPerDollar,
        benefits: body.benefits,
        organizationId: session.user.organizationId
      }
    })

    return NextResponse.json({ success: true, data: tier })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    const tier = await prisma.loyaltyTier.updateMany({
      where: { 
        tier: body.tier,
        organizationId: session.user.organizationId
      },
      data: {
        name: body.name,
        minPoints: body.minPoints,
        pointsPerDollar: body.pointsPerDollar,
        benefits: body.benefits
      }
    })

    return NextResponse.json({ success: true, data: tier })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 })
  }
}
