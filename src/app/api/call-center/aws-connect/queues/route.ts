import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { awsConnectService } from '@/lib/aws-connect.service'

export const dynamic = 'force-dynamic'

// GET /api/call-center/aws-connect/queues - Get AWS Connect Queues
export const GET = withApiHandler(
  async (_request: NextRequest, { requestId }: ApiContext) => {
    if (!awsConnectService.isConfigured()) {
      return apiError('AWS Connect not configured', {
        status: 400,
        requestId,
        meta: { queues: [] },
      })
    }

    const queues = await awsConnectService.listQueues()

    return apiSuccess({
      queues: queues.map(queue => ({
        id: queue.Id,
        arn: queue.Arn,
        name: queue.Name,
        type: queue.QueueType,
        description: (queue as any).Description || ''
      }))
    }, { requestId })
  },
  { route: 'GET /api/call-center/aws-connect/queues', rateLimit: RATE_LIMITS.standard }
)
