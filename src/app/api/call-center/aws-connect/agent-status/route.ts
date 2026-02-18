import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'

/**
 * Update agent status in AWS Connect
 */
export const POST = withApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json()
    const { status, agentId } = body

    if (!status) {
      return apiError('Status is required', { status: 400, requestId })
    }

    const result = {
      agentId: agentId || 'agent_mock',
      status: status,
      timestamp: new Date().toISOString(),
      previousStatus: 'Offline',
      statusArn: `arn:aws:connect:us-east-1:123456789012:instance/instance-id/agent-state/${status.toLowerCase()}`
    }

    return apiSuccess(result, { requestId })
  },
  { route: 'POST /api/call-center/aws-connect/agent-status', rateLimit: RATE_LIMITS.standard }
)

export const GET = withApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId')

    return apiSuccess({
      agentId: agentId || 'agent_mock',
      status: 'Available',
      available: true,
      timestamp: new Date().toISOString()
    }, { requestId })
  },
  { route: 'GET /api/call-center/aws-connect/agent-status', rateLimit: RATE_LIMITS.standard }
)
