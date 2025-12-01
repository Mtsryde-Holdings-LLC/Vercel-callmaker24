import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    const organizationId = user?.organizationId || 'cmi6rkqbo0001kn0xyo8383o9'

    const campaigns = await prisma.smsCampaign.findMany({
      where: { organizationId: organizationId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('SMS campaigns error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true }
    })

    const organizationId = user?.organizationId
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 })
    }

    const { id } = await req.json()
    const body = await req.json()

    const campaign = await prisma.smsCampaign.updateMany({
      where: { id, organizationId },
      data: body
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update SMS campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true }
    })

    const organizationId = user?.organizationId || 'cmi6rkqbo0001kn0xyo8383o9'
    const userId = user?.id || 'cmi6rkqbx0003kn0x6mitf439'

    const { name, message, scheduledFor, recipients, sendNow } = await req.json()

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Name and message are required' },
        { status: 400 }
      )
    }

    const status = sendNow ? 'SENT' : scheduledFor ? 'SCHEDULED' : 'DRAFT'

    const campaign = await prisma.smsCampaign.create({
      data: {
        name,
        message,
        status,
        scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
        sentAt: sendNow ? new Date() : null,
        createdById: userId,
        organizationId: organizationId,
        totalRecipients: recipients?.length || 0,
      },
    })

    // Send immediately if sendNow
    if (sendNow && recipients?.length > 0) {
      console.log('Sending SMS now to', recipients.length, 'recipients')
      const { SmsService } = await import('@/services/sms.service')
      const customers = await prisma.customer.findMany({
        where: { id: { in: recipients }, organizationId }
      })

      console.log('Found', customers.length, 'customers')

      let successCount = 0
      let failCount = 0
      
      for (const customer of customers) {
        if (customer.phone) {
          try {
            console.log('Sending SMS to:', customer.phone)
            const result = await SmsService.send({
              to: customer.phone,
              message: message,
              userId,
              organizationId,
              campaignId: campaign.id
            })
            console.log('SMS send result:', result)
            if (result.success) {
              successCount++
            } else {
              failCount++
              console.error(`SMS failed for ${customer.phone}:`, result.error)
            }
          } catch (error: any) {
            failCount++
            console.error(`Failed to send to ${customer.phone}:`, error.message)
          }
        }
      }
      
      console.log(`SMS Campaign ${campaign.id}: ${successCount} sent, ${failCount} failed`)
      
      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: { totalRecipients: successCount }
      })
    }

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Create SMS campaign error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}