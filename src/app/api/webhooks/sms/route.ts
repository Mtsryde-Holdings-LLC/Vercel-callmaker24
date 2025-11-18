import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const MessagingResponse = twilio.twiml.MessagingResponse

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const MessageSid = formData.get('MessageSid') as string
    const From = formData.get('From') as string
    const To = formData.get('To') as string
    const Body = formData.get('Body') as string
    const MessageStatus = formData.get('MessageStatus') as string

    // Log the incoming SMS for debugging
    console.log('Incoming SMS webhook:', {
      MessageSid,
      From,
      To,
      Body,
      MessageStatus,
    })

    // Find the SMS message to get organizationId
    const smsMessage = await prisma.smsMessage.findFirst({
      where: { 
        OR: [
          { to: From },
          { twilioMessageSid: MessageSid }
        ]
      },
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

    let organizationId: string | null = null
    if (smsMessage) {
      organizationId = smsMessage.campaign?.organizationId || smsMessage.customer?.organizationId || null
    }

    // If organizationId found, process the message (scoped to organization)
    if (organizationId && MessageSid) {
      await prisma.smsMessage.updateMany({
        where: {
          twilioMessageSid: MessageSid,
          campaign: { organizationId }
        },
        data: {
          status: MessageStatus === 'delivered' ? 'DELIVERED' : MessageStatus === 'failed' ? 'FAILED' : 'SENT',
          deliveredAt: MessageStatus === 'delivered' ? new Date() : null
        }
      })
    }

    // Send TwiML response (optional - for auto-replies)
    const twiml = new MessagingResponse()
    // Uncomment to send auto-reply:
    // twiml.message('Thank you for your message! We will get back to you soon.')

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    })
  } catch (error) {
    console.error('SMS webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
