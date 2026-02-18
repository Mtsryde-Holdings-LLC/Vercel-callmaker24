import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'

export const GET = withApiHandler(
  async (_request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const mockFlows = [
      {
        id: '1',
        name: 'Main Reception',
        description: 'Primary customer intake flow',
        nodes: [
          {
            id: 'welcome',
            type: 'message',
            label: 'Welcome Message',
            prompt: 'Thank you for calling CallMaker24.'
          },
          {
            id: 'main-menu',
            type: 'menu',
            label: 'Main Menu',
            prompt: 'Press 1 for Sales, Press 2 for Support, Press 0 for Operator',
            options: [
              { key: '1', action: 'Forward to Sales' },
              { key: '2', action: 'Forward to Support' },
              { key: '0', action: 'Forward to Operator' }
            ]
          }
        ],
        status: 'active',
        callsHandled: 1247,
        organizationId
      }
    ]

    return apiSuccess(mockFlows, { requestId })
  },
  { route: 'GET /api/ivr/flows', rateLimit: RATE_LIMITS.standard }
)

export const POST = withApiHandler(
  async (request: NextRequest, { organizationId, requestId }: ApiContext) => {
    const body = await request.json()

    const newFlow = {
      id: Date.now().toString(),
      ...body,
      status: 'draft',
      callsHandled: 0,
      organizationId,
      createdAt: new Date().toISOString()
    }
    
    return apiSuccess(newFlow, { requestId, status: 201 })
  },
  { route: 'POST /api/ivr/flows', rateLimit: RATE_LIMITS.standard }
)
