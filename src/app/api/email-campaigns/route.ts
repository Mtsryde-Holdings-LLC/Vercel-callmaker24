import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'

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
export const GET = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {
      organizationId,
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

    return apiSuccess(campaigns, {
      requestId,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  },
  { route: 'GET /api/email-campaigns', rateLimit: RATE_LIMITS.standard }
)

// POST /api/email-campaigns
export const POST = withApiHandler(
  async (_request: NextRequest, { organizationId, session, body, requestId }: ApiContext) => {
    const validatedData = body as z.infer<typeof campaignSchema>

    const campaign = await prisma.emailCampaign.create({
      data: {
        ...validatedData,
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : undefined,
        createdById: session.user.id,
        organizationId,
      },
    })

    // If scheduled for immediate sending, mark as scheduled
    if (!validatedData.scheduledAt) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SCHEDULED' },
      })
    }

    return apiSuccess(campaign, { status: 201, requestId })
  },
  {
    route: 'POST /api/email-campaigns',
    rateLimit: RATE_LIMITS.standard,
    bodySchema: campaignSchema,
  }
)
