import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

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

    // Find the call record to get organizationId
    const call = await prisma.call.findFirst({
      where: { twilioCallSid: CallSid },
      include: {
        customer: {
          select: { organizationId: true }
        }
      }
    })

    if (!call) {
      console.warn('Call not found for webhook event:', CallSid)
      return NextResponse.json({ received: true })
    }

    const organizationId = call.customer?.organizationId

    if (!organizationId) {
      console.warn('No organizationId found for call webhook:', CallSid)
      return NextResponse.json({ received: true })
    }

    // Update call record (scoped to organization)
    const statusMap: Record<string, 'INITIATED' | 'RINGING' | 'IN_PROGRESS' | 'COMPLETED' | 'BUSY' | 'FAILED' | 'NO_ANSWER' | 'CANCELLED'> = {
      'initiated': 'INITIATED',
      'ringing': 'RINGING',
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETED',
      'busy': 'BUSY',
      'failed': 'FAILED',
      'no-answer': 'NO_ANSWER',
      'canceled': 'CANCELLED',
      'cancelled': 'CANCELLED'
    }

    await prisma.call.updateMany({
      where: { 
        twilioCallSid: CallSid,
        customer: { organizationId }
      },
      data: {
        status: statusMap[CallStatus] || 'INITIATED',
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Voice status webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
