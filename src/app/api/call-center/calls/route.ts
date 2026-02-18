import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json()
    const { phoneNumber, action } = body

    const callData = {
      id: `call_${Date.now()}`,
      phoneNumber,
      status: action === 'start' ? 'initiated' : 'ended',
      startTime: new Date().toISOString(),
      duration: 0,
      organizationId
    }

    return apiSuccess(callData, { requestId })
  },
  { route: 'POST /api/call-center/calls', rateLimit: RATE_LIMITS.standard }
)

export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const calls = await prisma.call.findMany({
      where: { organizationId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            company: true
          }
        },
        assignedTo: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    const transformedCalls = calls.map(call => ({
      id: call.id,
      phoneNumber: call.to,
      customerName: call.customer 
        ? `${call.customer.firstName || ''} ${call.customer.lastName || ''}`.trim() 
        : 'Unknown',
      startTime: call.startedAt?.toISOString() || call.createdAt.toISOString(),
      duration: call.duration || 0,
      status: call.status?.toLowerCase() || 'completed',
      agent: call.assignedTo?.name || 'Unknown',
      disposition: (call.metadata as any)?.disposition || 'N/A'
    }))

    return apiSuccess(transformedCalls, { requestId })
  },
  { route: 'GET /api/call-center/calls', rateLimit: RATE_LIMITS.standard }
)
