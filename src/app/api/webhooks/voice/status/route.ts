import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const VoiceResponse = twilio.twiml.VoiceResponse

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const CallSid = formData.get('CallSid') as string
    const CallStatus = formData.get('CallStatus') as string
    const To = formData.get('To') as string
    const From = formData.get('From') as string
    const Direction = formData.get('Direction') as string

    console.log('Voice call status webhook:', {
      CallSid,
      CallStatus,
      To,
      From,
      Direction,
    })

    // Update call record in database
    // TODO: Find and update the call record
    /*
    await prisma.call.update({
      where: { twilioCallSid: CallSid },
      data: {
        status: CallStatus,
        updatedAt: new Date(),
      },
    })
    */

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Voice status webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
