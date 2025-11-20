import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Find the SMS message to get organizationId
    const smsMessage = await prisma.smsMessage.findFirst({
      where: { twilioSid: MessageSid },
      include: {
        campaign: {
          select: { organizationId: true }
        },
        customer: {
          select: { organizationId: true }
        }
      }
    })

    if (!smsMessage) {
      console.warn('SMS message not found for webhook event:', MessageSid)
      return NextResponse.json({ received: true })
    }

    const organizationId = smsMessage.campaign?.organizationId || smsMessage.customer?.organizationId

    if (!organizationId) {
      console.warn('No organizationId found for SMS webhook event:', MessageSid)
      return NextResponse.json({ received: true })
    }

    // Update SMS message status (scoped to organization)
    const statusMap: Record<string, 'DELIVERED' | 'SENT' | 'FAILED' | 'UNDELIVERED' | 'PENDING'> = {
      'delivered': 'DELIVERED',
      'sent': 'SENT',
      'failed': 'FAILED',
      'undelivered': 'UNDELIVERED'
    }

    await prisma.smsMessage.updateMany({
      where: { 
        twilioSid: MessageSid,
        OR: [
          { campaign: { organizationId } },
          { customer: { organizationId } }
        ]
      },
      data: {
        status: statusMap[MessageStatus] || 'PENDING',
        errorCode: ErrorCode || undefined,
        errorMessage: ErrorMessage || undefined,
        deliveredAt: MessageStatus === 'delivered' ? new Date() : undefined,
        failedAt: MessageStatus === 'failed' ? new Date() : undefined,
      },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('SMS status webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
