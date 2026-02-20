import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

export const GET = withApiHandler(
  async (_req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const campaigns = await prisma.ivrCampaign.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    })

    return apiSuccess(campaigns, { requestId })
  },
  { route: 'GET /api/ivr/campaigns', rateLimit: RATE_LIMITS.standard }
)

export const POST = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await req.json()
    const { name, templateId, recipients, scheduledFor } = body

    const campaign = await prisma.ivrCampaign.create({
      data: {
        name,
        templateId,
        recipients,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        totalCalls: Array.isArray(recipients) ? recipients.length : 0,
        organizationId
      }
    })

    return apiSuccess(campaign, { requestId })
  },
  { route: 'POST /api/ivr/campaigns', rateLimit: RATE_LIMITS.standard }
)
