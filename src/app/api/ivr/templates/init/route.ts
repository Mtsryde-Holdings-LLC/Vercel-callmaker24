import { NextRequest } from 'next/server'
import { withApiHandler, ApiContext } from '@/lib/api-handler'
import { apiSuccess } from '@/lib/api-response'
import { RATE_LIMITS } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

const DEFAULT_TEMPLATES = [
  {
    name: 'Appointment Reminder',
    type: 'APPOINTMENT',
    script: 'Hello {{firstName}}, this is {{companyName}}. This is a reminder about your appointment on {{appointmentDate}} at {{appointmentTime}}. Press 1 to confirm, Press 2 to reschedule, or Press 3 to cancel.',
    variables: ['firstName', 'companyName', 'appointmentDate', 'appointmentTime']
  },
  {
    name: 'Post-Service Survey',
    type: 'SURVEY',
    script: 'Hello {{firstName}}, thank you for choosing {{companyName}}. We would love your feedback. On a scale of 1 to 5, how satisfied were you with our service? Press 1 for very dissatisfied, Press 5 for very satisfied.',
    variables: ['firstName', 'companyName']
  },
  {
    name: 'Promotion Announcement',
    type: 'PROMOTION',
    script: 'Hello {{firstName}}, this is {{companyName}} with an exclusive offer! {{promotionDetails}}. Press 1 to learn more, or Press 2 to opt out of future promotions.',
    variables: ['firstName', 'companyName', 'promotionDetails']
  }
]

export const POST = withApiHandler(
  async (_req: NextRequest, { organizationId, requestId }: ApiContext) => {
    const templates = await Promise.all(
      DEFAULT_TEMPLATES.map(template =>
        prisma.ivrTemplate.create({
          data: {
            ...template,
            organizationId
          }
        })
      )
    )

    return apiSuccess(templates, { requestId })
  },
  { route: 'POST /api/ivr/templates/init', rateLimit: RATE_LIMITS.standard }
)
