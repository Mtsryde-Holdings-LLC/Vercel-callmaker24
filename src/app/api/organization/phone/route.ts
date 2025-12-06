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

    const { action } = await req.json()

    if (action === 'purchase') {
      const availableNumbers = await twilio.availablePhoneNumbers('US').local.list({ limit: 1 })

      if (!availableNumbers.length) {
        return NextResponse.json({ error: 'No numbers available' }, { status: 400 })
      }

      const number = availableNumbers[0]
      const purchasedNumber = await twilio.incomingPhoneNumbers.create({
        phoneNumber: number.phoneNumber,
        voiceUrl: `${process.env.NEXTAUTH_URL}/api/ivr/direct`,
        voiceMethod: 'POST',
        smsUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/twilio/sms`,
        smsMethod: 'POST'
      })

      await prisma.organization.update({
        where: { id: session.user.organizationId },
        data: {
          twilioPhoneNumber: purchasedNumber.phoneNumber,
          twilioPhoneSid: purchasedNumber.sid
        }
      })

      return NextResponse.json({ 
        phoneNumber: purchasedNumber.phoneNumber,
        sid: purchasedNumber.sid
      })
    }

    if (action === 'release') {
      const org = await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
        select: { twilioPhoneSid: true }
      })

      if (org?.twilioPhoneSid) {
        await twilio.incomingPhoneNumbers(org.twilioPhoneSid).remove()
        
        await prisma.organization.update({
          where: { id: session.user.organizationId },
          data: {
            twilioPhoneNumber: null,
            twilioPhoneSid: null
          }
        })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Phone management error:', error)
    return NextResponse.json({ error: 'Failed to manage phone' }, { status: 500 })
  }
}
