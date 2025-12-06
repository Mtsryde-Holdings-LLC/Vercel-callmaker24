import { NextRequest, NextResponse } from 'next/server'

const twilio = require('twilio')

export async function POST(req: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse()
  twiml.say('Connecting you now.')
  twiml.dial().number(req.nextUrl.searchParams.get('agentId') || '')
  
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' }
  })
}
