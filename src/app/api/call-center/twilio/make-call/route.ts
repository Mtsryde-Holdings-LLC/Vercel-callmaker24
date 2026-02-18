import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess, apiError } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { VoiceService } from '@/services/voice.service'

export const POST = withApiHandler(
  async (request: NextRequest, { session, organizationId, requestId }: ApiContext) => {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return apiError('Phone number required', { status: 400, requestId })
    }

    const result = await VoiceService.initiateCall({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER ?? undefined,
      userId: session.user.id,
      organizationId: organizationId ?? undefined
    })

    if (result.success) {
      return apiSuccess({
        success: true,
        callId: result.data?.callId,
        callSid: result.data?.callSid
      }, { requestId })
    } else {
      return apiError(result.error || 'Failed to initiate call', { status: 500, requestId })
    }
  },
  { route: 'POST /api/call-center/twilio/make-call', rateLimit: RATE_LIMITS.standard }
)