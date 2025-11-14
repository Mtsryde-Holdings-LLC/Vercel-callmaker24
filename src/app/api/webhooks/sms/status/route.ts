import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const MessageSid = formData.get('MessageSid') as string
    const MessageStatus = formData.get('MessageStatus') as string
    const To = formData.get('To') as string
    const ErrorCode = formData.get('ErrorCode') as string
    const ErrorMessage = formData.get('ErrorMessage') as string

    console.log('SMS status webhook:', {
      MessageSid,
      MessageStatus,
      To,
      ErrorCode,
      ErrorMessage,
    })

    // Update SMS campaign delivery status
    // TODO: Find and update the SMS record in database
    /*
    await prisma.smsCampaign.update({
      where: { twilioSid: MessageSid },
      data: {
        status: MessageStatus,
        errorCode: ErrorCode,
        errorMessage: ErrorMessage,
      },
    })
    */

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('SMS status webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
