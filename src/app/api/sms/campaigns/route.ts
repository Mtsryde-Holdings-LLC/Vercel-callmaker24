import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    const organizationId = user?.organizationId || 'cmi6rkqbo0001kn0xyo8383o9'

    const campaigns = await prisma.smsCampaign.findMany({
      where: { organizationId: organizationId },
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true }
    })

    const organizationId = user?.organizationId || 'cmi6rkqbo0001kn0xyo8383o9'
    const userId = user?.id || 'cmi6rkqbx0003kn0x6mitf439'

    const { name, message, scheduledFor, recipients } = await req.json()

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
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        createdById: userId,
        organizationId: organizationId,
        totalRecipients: recipients?.length || 0,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Create SMS campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}