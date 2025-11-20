import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// SendGrid webhook for email events
export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (recommended for production)
    const signature = req.headers.get('x-twilio-email-event-webhook-signature')
    
    const events = await req.json()

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    for (const event of events) {
      const { sg_message_id, event: eventType, email, timestamp } = event

      console.log('Email webhook event:', {
        messageId: sg_message_id,
        event: eventType,
        email,
        timestamp,
      })

      // Find the email message to get organizationId
      const emailMessage = await prisma.emailMessage.findFirst({
        where: { to: email },
        include: {
          campaign: {
            select: { organizationId: true }
          },
          customer: {
            select: { organizationId: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (!emailMessage) {
        console.warn('Email message not found for webhook event:', email)
        continue
      }

      const organizationId = emailMessage.campaign?.organizationId || emailMessage.customer?.organizationId

      if (!organizationId) {
        console.warn('No organizationId found for email webhook event:', email)
        continue
      }

      // Update email campaign analytics based on event type (scoped to organization)
      switch (eventType) {
        case 'delivered':
          await prisma.emailMessage.updateMany({
            where: { 
              to: email,
              campaign: { organizationId }
            },
            data: { status: 'DELIVERED', deliveredAt: new Date() }
          })
          break
        case 'open':
          await prisma.emailMessage.updateMany({
            where: { 
              to: email,
              campaign: { organizationId }
            },
            data: { openedAt: new Date() }
          })
          break
        case 'click':
          await prisma.emailMessage.updateMany({
            where: { 
              to: email,
              campaign: { organizationId }
            },
            data: { clickedAt: new Date() }
          })
          break
        case 'bounce':
        case 'dropped':
          await prisma.emailMessage.updateMany({
            where: { 
              to: email,
              campaign: { organizationId }
            },
            data: { status: 'BOUNCED', bouncedAt: new Date() }
          })
          break
        case 'spam_report':
          await prisma.customer.updateMany({
            where: { 
              email,
              organizationId 
            },
            data: { emailOptIn: false }
          })
          break
        case 'unsubscribe':
          await prisma.customer.updateMany({
            where: { 
              email,
              organizationId 
            },
            data: { emailOptIn: false }
          })
          break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Email webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
