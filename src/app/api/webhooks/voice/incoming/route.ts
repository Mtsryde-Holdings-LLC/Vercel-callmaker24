import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const CallSid = formData.get('CallSid') as string
    const From = formData.get('From') as string
    const To = formData.get('To') as string

    console.log('Incoming call:', { CallSid, From, To })

    // Find organization by Twilio phone number
    const org = await prisma.organization.findFirst({
      where: { twilioPhoneNumber: To }
    })

    if (!org) {
      const twiml = new VoiceResponse()
      twiml.say('Sorry, this number is not configured.')
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: From, organizationId: org.id }
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          phone: From,
          name: `Caller ${From}`,
          organizationId: org.id
        }
      })
    }

    // Create call record
    await prisma.call.create({
      data: {
        twilioCallSid: CallSid,
        direction: 'INBOUND',
        from: From,
        to: To,
        status: 'ringing',
        customerId: customer.id
      }
    })

    // Log activity
    await prisma.customerActivity.create({
      data: {
        customerId: customer.id,
        type: 'CALL',
        description: `Incoming call from ${From}`
      }
    })

    // TwiML response
    const twiml = new VoiceResponse()
    twiml.say('Thank you for calling. Please hold while we connect you.')
    twiml.dial({ timeout: 30, action: '/api/webhooks/voice/status' }, To)

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('Incoming call error:', error)
    const twiml = new VoiceResponse()
    twiml.say('An error occurred. Please try again later.')
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
