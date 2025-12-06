import { NextRequest, NextResponse } from 'next/server'

const twilio = require('twilio')

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get('orgId')

    const twiml = new twilio.twiml.VoiceResponse()
    twiml.say('Processing your request. Please hold.')
    twiml.pause({ length: 3 })
    twiml.redirect(`/api/ivr/ai-response?orgId=${orgId}`)

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  } catch (error) {
    console.error('AI agent error:', error)
    const twiml = new twilio.twiml.VoiceResponse()
    twiml.say('An error occurred.')
    twiml.hangup()
    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    })
  }
}
