import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const MessageSid = formData.get('MessageSid') as string
    const MessageStatus = formData.get('MessageStatus') as string
    const ErrorCode = formData.get('ErrorCode') as string
    const ErrorMessage = formData.get('ErrorMessage') as string

    console.log('SMS Status Update:', {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
    })

    if (MessageSid) {
      await prisma.smsMessage.updateMany({
        where: { twilioMessageSid: MessageSid },
        data: {
          status: MessageStatus === 'delivered' ? 'DELIVERED' : 
                 MessageStatus === 'failed' ? 'FAILED' : 
                 MessageStatus === 'undelivered' ? 'FAILED' : 'SENT',
          deliveredAt: MessageStatus === 'delivered' ? new Date() : null,
          errorCode: ErrorCode || null,
          errorMessage: ErrorMessage || null
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SMS status webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}