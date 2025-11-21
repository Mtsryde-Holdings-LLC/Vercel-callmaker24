import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SmsService } from '@/services/sms.service'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 })
    }

    const { recipients } = await req.json()

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients' }, { status: 400 })
    }

    const campaign = await prisma.smsCampaign.findFirst({
      where: { id: params.id, organizationId: user.organizationId }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { id: { in: recipients }, organizationId: user.organizationId }
    })

    let sent = 0
    for (const customer of customers) {
      if (customer.phone) {
        try {
          await SmsService.send(
            customer.phone,
            campaign.message,
            session.user.id,
            user.organizationId,
            campaign.id
          )
          sent++
        } catch (error) {
          console.error(`Failed to send SMS to ${customer.phone}:`, error)
        }
      }
    }

    await prisma.smsCampaign.update({
      where: { id: params.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        totalRecipients: sent
      }
    })

    return NextResponse.json({ success: true, sent })
  } catch (error) {
    console.error('Send SMS campaign error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
