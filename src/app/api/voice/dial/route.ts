import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, customerId } = await req.json()

    const org = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { twilioPhoneNumber: true }
    })

    if (!org?.twilioPhoneNumber) {
      return NextResponse.json({ error: 'No phone number configured' }, { status: 400 })
    }

    const call = await twilio.calls.create({
      to,
      from: org.twilioPhoneNumber,
      url: `${process.env.NEXTAUTH_URL}/api/voice/connect?agentId=${session.user.id}`,
      statusCallback: `${process.env.NEXTAUTH_URL}/api/voice/status`,
      statusCallbackEvent: ['completed']
    })

    await prisma.call.create({
      data: {
        twilioCallSid: call.sid,
        direction: 'OUTBOUND',
        status: 'INITIATED',
        from: org.twilioPhoneNumber,
        to,
        customerId,
        assignedToId: session.user.id,
        organizationId: session.user.organizationId
      }
    })

    return NextResponse.json({ callSid: call.sid })
  } catch (error) {
    console.error('Dial error:', error)
    return NextResponse.json({ error: 'Failed to dial' }, { status: 500 })
  }
}
