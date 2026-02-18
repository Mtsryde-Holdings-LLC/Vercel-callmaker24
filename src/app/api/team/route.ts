import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// GET /api/team - Get all users in the organization
export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    return apiSuccess(users, { requestId })
  },
  { route: 'GET /api/team', rateLimit: RATE_LIMITS.standard }
)
