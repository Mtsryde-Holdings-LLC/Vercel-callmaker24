import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

const VoiceResponse = twilio.twiml.VoiceResponse

export async function GET() {
  const twiml = new VoiceResponse()
  twiml.say('Webhook is working')
  twiml.hangup()
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' }
  })
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const CallSid = formData.get('CallSid') as string
    const From = formData.get('From') as string
    const To = formData.get('To') as string

    // Find or create customer with default org
    let customer = await prisma.customer.findFirst({
      where: { phone: From }
    })

    if (!customer) {
      const org = await prisma.organization.findFirst()
      if (org) {
        customer = await prisma.customer.create({
          data: {
            phone: From,
            name: `Caller ${From}`,
            organizationId: org.id
          }
        })
      }
    }

    // Create call record
    if (customer) {
      await prisma.call.create({
        data: {
          twilioCallSid: CallSid,
          direction: 'INBOUND',
          from: From,
          to: To,
          status: 'completed',
          customerId: customer.id
        }
      })

      await prisma.customerActivity.create({
        data: {
          customerId: customer.id,
          type: 'CALL',
          description: `Incoming call from ${From}`
        }
      })
    }

    const twiml = new VoiceResponse()
    const gather = twiml.gather({
      numDigits: 1,
      action: '/api/webhooks/voice/ivr-menu',
      method: 'POST'
    })
    
    gather.say('Thank you for calling. Press 1 for Sales. Press 2 for Support. Press 3 for Billing. Press 0 to speak with an operator.')
    twiml.redirect('/api/webhooks/voice/incoming')

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('Incoming call error:', error)
    const twiml = new VoiceResponse()
    twiml.say('Thank you for calling.')
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
