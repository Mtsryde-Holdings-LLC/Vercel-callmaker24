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
    twiml.say(`Welcome to ${org.name}. Our AI assistant will help you. Please speak after the tone.`)
    twiml.record({
      action: `/api/ivr/ai-agent?orgId=${org.id}`,
      method: 'POST',
      maxLength: 30,
      transcribe: true,
      transcribeCallback: `/api/ivr/ai-process?orgId=${org.id}`
    })

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
