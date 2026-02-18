import { NextRequest } from 'next/server'
import { withApiHandler, withPublicApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

export const GET = withApiHandler(
  async (_req: NextRequest, { params, requestId }: ApiContext) => {
    const responses = await prisma.ivrResponse.findMany({
      where: { campaignId: params.id },
      orderBy: { createdAt: 'desc' }
    })

    const stats = {
      totalResponses: responses.length,
      confirmed: responses.filter(r => r.response === '1').length,
      rescheduled: responses.filter(r => r.response === '2').length,
      cancelled: responses.filter(r => r.response === '3').length
    }

    return apiSuccess({ responses, stats }, { requestId })
  },
  { route: 'GET /api/ivr/campaigns/[id]/responses', rateLimit: RATE_LIMITS.standard }
)

export const POST = withPublicApiHandler(
  async (req: NextRequest, { params, requestId }: ApiContext) => {
    const body = await req.json()
    const { customerPhone, customerName, response, callSid, callDuration, responseData } = body

    const ivrResponse = await prisma.ivrResponse.create({
      data: {
        campaignId: params.id,
        customerPhone,
        customerName,
        response,
        callSid,
        callDuration,
        responseData
      }
    })

    return apiSuccess(ivrResponse, { requestId })
  },
  { route: 'POST /api/ivr/campaigns/[id]/responses', rateLimit: RATE_LIMITS.webhook }
)
