import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

export const GET = withApiHandler(
  async (_req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const templates = await prisma.ivrTemplate.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' }
    })

    return apiSuccess(templates, { requestId })
  },
  { route: 'GET /api/ivr/templates', rateLimit: RATE_LIMITS.standard }
)

export const POST = withApiHandler(
  async (req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await req.json()
    const { name, type, script, variables } = body

    const template = await prisma.ivrTemplate.create({
      data: {
        name,
        type,
        script,
        variables: variables || [],
        organizationId
      }
    })

    return apiSuccess(template, { requestId })
  },
  { route: 'POST /api/ivr/templates', rateLimit: RATE_LIMITS.standard }
)
