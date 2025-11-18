import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const campaigns = await prisma.smsCampaign.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('SMS campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const { name, message, scheduledFor } = await req.json()

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      )
    }

    const status = scheduledFor ? 'SCHEDULED' : 'DRAFT'

    const campaign = await prisma.smsCampaign.create({
      data: {
        name,
        message,
        status,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdById: user.id,
        organizationId: user.organizationId,
        totalRecipients: 0,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Create SMS campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
