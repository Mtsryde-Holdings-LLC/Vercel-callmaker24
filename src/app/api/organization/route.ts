import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'

export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, slug: true, twilioPhoneNumber: true, agentContactNumber: true, ivrConfig: true }
    })

    return apiSuccess(org, { requestId })
  },
  { route: 'GET /api/organization', rateLimit: RATE_LIMITS.standard }
)

export const PATCH = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json()
    
    await prisma.organization.update({
      where: { id: organizationId },
      data: body
    })

    return apiSuccess({ updated: true }, { requestId })
  },
  { route: 'PATCH /api/organization', rateLimit: RATE_LIMITS.admin }
)
