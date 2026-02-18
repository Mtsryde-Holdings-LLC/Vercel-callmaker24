import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'

/**
 * End an active call via AWS Connect
 */
export const POST = withApiHandler(
  async (request: NextRequest, { requestId }: ApiContext) => {
    const body = await request.json()
    const { contactId, callId, disposition, notes } = body

    const result = {
      contactId: contactId || `contact_${Date.now()}`,
      callId: callId || 'current_call',
      status: 'ended',
      endTime: new Date().toISOString(),
      duration: Math.floor(Math.random() * 600) + 30,
      disposition: disposition || 'completed',
      notes: notes || '',
      recording: {
        available: true,
        url: '/recordings/mock-recording.mp3',
        duration: Math.floor(Math.random() * 600) + 30
      },
      transcript: {
        available: false,
        url: null
      }
    }

    return apiSuccess(result, { requestId })
  },
  { route: 'POST /api/call-center/aws-connect/end-call', rateLimit: RATE_LIMITS.standard }
)
