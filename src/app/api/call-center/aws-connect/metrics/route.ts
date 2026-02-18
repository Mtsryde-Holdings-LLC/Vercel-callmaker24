import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { awsConnectService } from '@/lib/aws-connect.service'

export const dynamic = 'force-dynamic'

// GET /api/call-center/aws-connect/metrics - Get AWS Connect real-time metrics
export const GET = withApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    if (!awsConnectService.isConfigured()) {
      return apiError('AWS Connect not configured', {
        status: 400,
        requestId,
        meta: { metrics: {} },
      })
    }

    const { searchParams } = new URL(request.url)
    const queueId = searchParams.get('queueId') || undefined

    const metrics = await awsConnectService.getCurrentMetrics(queueId)

    const parsedMetrics: Record<string, any> = {}
    metrics.forEach(result => {
      result.Collections?.forEach(collection => {
        const metricName = collection.Metric?.Name
        const value = collection.Value
        if (metricName && value !== undefined) {
          parsedMetrics[metricName] = value
        }
      })
    })

    return apiSuccess({
      metrics: {
        agentsOnline: parsedMetrics.AGENTS_ONLINE || 0,
        agentsAvailable: parsedMetrics.AGENTS_AVAILABLE || 0,
        agentsOnCall: parsedMetrics.AGENTS_ON_CALL || 0,
        contactsInQueue: parsedMetrics.CONTACTS_IN_QUEUE || 0,
        oldestContactAge: parsedMetrics.OLDEST_CONTACT_AGE || 0
      },
      timestamp: new Date().toISOString()
    }, { requestId })
  },
  { route: 'GET /api/call-center/aws-connect/metrics', rateLimit: RATE_LIMITS.standard }
)
