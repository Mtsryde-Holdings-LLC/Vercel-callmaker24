import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const twilio = require('twilio')

export async function POST(req: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse()
  
  try {
    console.log('[IVR] Incoming call')
    const formData = await req.formData()
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    console.log('[IVR] From:', from, 'To:', to)

    const org = await prisma.organization.findUnique({
      where: { twilioPhoneNumber: to },
      select: { id: true, name: true, ivrConfig: true, agentContactNumber: true }
    })

    console.log('[IVR] Org found:', !!org)

    if (!org) {
      twiml.say('This number is not configured. Please contact support.')
      twiml.hangup()
      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' }
      })
    }

    twiml.say(`Welcome to CallMaker24 AI Call Support Center. Connecting you to ${org.name}.`)
    
    if (org.agentContactNumber) {
      console.log('[IVR] Dialing agent:', org.agentContactNumber)
      twiml.say('Routing to agent.')
      twiml.dial(org.agentContactNumber)
    } else {
      console.log('[IVR] Using AI agent')
      twiml.say('Our AI assistant will help you. Please speak after the tone.')
      twiml.record({
        action: `/api/ivr/ai-agent?orgId=${org.id}`,
        method: 'POST',
        maxLength: 30,
        transcribe: true,
        transcribeCallback: `/api/ivr/ai-process?orgId=${org.id}`
      })
    }

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('[IVR] Error:', error)
    twiml.say('An error occurred. Please try again later.')
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
