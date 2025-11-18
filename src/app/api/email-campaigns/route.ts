import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailService } from '@/services/email.service'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const campaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  previewText: z.string().optional(),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional(),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  segmentIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
})

// GET /api/email-campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''

    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (status) {
      where.status = status
    }

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.emailCampaign.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('GET email campaigns error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/email-campaigns
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = campaignSchema.parse(body)

    const campaign = await prisma.emailCampaign.create({
      data: {
        ...validatedData,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : undefined,
        createdById: session.user.id,
        organizationId: session.user.organizationId,
      },
    })

    // If scheduled for immediate sending, trigger send
    if (!validatedData.scheduledAt) {
      // Queue for sending (implement queue system)
      // For now, we'll mark as scheduled
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SCHEDULED' },
      })
    }

    return NextResponse.json({
      success: true,
      data: campaign,
    })
  } catch (error: any) {
    console.error('POST email campaign error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
