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

    const campaigns = await prisma.emailCampaign.findMany({
      where: { organizationId: organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Email campaigns error:', error)
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

    const { name, subject, fromName, fromEmail, replyTo, preheader, content, scheduledFor } = await req.json()

    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: 'Name, subject, and content are required' },
        { status: 400 }
      )
    }

    const status = scheduledFor ? 'SCHEDULED' : 'DRAFT'

    const campaign = await prisma.emailCampaign.create({
      data: {
        name,
        subject,
        htmlContent: content,
        fromName: fromName || 'CallMaker24',
        fromEmail: fromEmail || 'noreply@callmaker24.com',
        replyTo: replyTo,
        previewText: preheader,
        status,
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        createdById: userId,
        organizationId: organizationId,
        totalRecipients: 0,
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Create email campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
