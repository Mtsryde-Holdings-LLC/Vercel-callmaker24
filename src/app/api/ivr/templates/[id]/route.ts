import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

export const PATCH = withApiHandler(
  async (req: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    const body = await req.json()
    const { name, type, script, variables } = body

    const template = await prisma.ivrTemplate.update({
      where: { 
        id: params.id,
        organizationId 
      },
      data: { name, type, script, variables }
    })

    return apiSuccess(template, { requestId })
  },
  { route: 'PATCH /api/ivr/templates/[id]', rateLimit: RATE_LIMITS.standard }
)

export const DELETE = withApiHandler(
  async (_req: NextRequest, { organizationId, params, requestId }: ApiContext) => {
    await prisma.ivrTemplate.delete({
      where: { 
        id: params.id,
        organizationId 
      }
    })

    return apiSuccess({ success: true }, { requestId })
  },
  { route: 'DELETE /api/ivr/templates/[id]', rateLimit: RATE_LIMITS.standard }
)
