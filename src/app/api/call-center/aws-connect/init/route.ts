import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { awsConnectService } from '@/lib/aws-connect.service'

/**
 * Initialize AWS Connect Contact Control Panel (CCP)
 */
export const POST = withApiHandler(
  async (_request: NextRequest, { requestId }: ApiContext) => {
    const config = awsConnectService.getConfig()

    if (!config.isConfigured) {
      return apiError('AWS Connect not configured', {
        status: 400,
        requestId,
        meta: {
          message: 'Please set AWS_CONNECT_INSTANCE_ID, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY',
          status: 'disconnected',
        },
      })
    }

    try {
      const instance = await awsConnectService.getInstance()

      return apiSuccess({
        status: 'connected',
        ccpUrl: config.ccpUrl,
        instanceId: config.instanceId,
        instanceArn: instance?.Arn || config.instanceArn,
        region: config.region,
        softphoneEnabled: true,
        instanceAlias: instance?.InstanceAlias,
        message: 'Successfully connected to AWS Connect'
      }, { requestId })
    } catch (_verifyError) {
      return apiSuccess({
        status: 'configured',
        ccpUrl: config.ccpUrl,
        instanceId: config.instanceId,
        region: config.region,
        message: 'AWS Connect configured but verification failed',
      }, { requestId })
    }
  },
  { route: 'POST /api/call-center/aws-connect/init', rateLimit: RATE_LIMITS.standard }
)
