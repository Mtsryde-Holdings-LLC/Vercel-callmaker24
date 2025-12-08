import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const templates = await Promise.all(
      DEFAULT_TEMPLATES.map(template =>
        prisma.ivrTemplate.create({
          data: {
            ...template,
            organizationId: session.user.organizationId
          }
        })
      )
    )

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Templates init error:', error)
    return NextResponse.json({ error: 'Failed to initialize templates' }, { status: 500 })
  }
}
