import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { PaymentService } from '@/services/payment.service'

export const POST = withApiHandler(
  async (request: NextRequest, { session, requestId }: ApiContext) => {
    const { priceId, paymentMethodId } = await request.json()

    if (!priceId) {
      return apiError('Price ID is required', { status: 400, requestId })
    }

    const result = await PaymentService.createSubscription(
      session.user.id,
      priceId,
      paymentMethodId
    )

    if (!result.success) {
      return apiError(result.error || 'Failed to create subscription', { status: 500, requestId })
    }

    return apiSuccess(result.data, { requestId })
  },
  { route: 'POST /api/create-subscription', rateLimit: RATE_LIMITS.standard }
)
