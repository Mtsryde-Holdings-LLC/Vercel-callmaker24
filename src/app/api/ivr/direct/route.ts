import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const twilio = require('twilio')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string

    const org = await prisma.organization.findUnique({
      where: { twilioPhoneNumber: to },
      select: { id: true, name: true, ivrConfig: true }
    })

    if (!org) {
      const twiml = new twilio.twiml.VoiceResponse()
      twiml.say('This number is not configured. Please contact support.')
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    const twiml = new twilio.twiml.VoiceResponse()
    const gather = twiml.gather({
      numDigits: 1,
      action: `/api/ivr/menu?orgId=${org.id}`,
      method: 'POST'
    })

    gather.say(`Welcome to ${org.name}. Press 1 for Sales, 2 for Support, 3 for Billing, 4 for General Inquiries, or 0 for Operator.`)

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('Direct IVR error:', error)
    const twiml = new twilio.twiml.VoiceResponse()
    twiml.say('An error occurred. Please try again later.')
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
