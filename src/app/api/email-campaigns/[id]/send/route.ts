import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/services/email.service'

// POST /api/email-campaigns/:id/send
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, organizationId: true }
    })

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: 'Forbidden - No organization' }, { status: 403 })
    }

    // Verify campaign belongs to user's organization
    const campaign = await prisma.emailCampaign.findFirst({
      where: { 
        id: params.id,
        organizationId: user.organizationId
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Get recipients from user's organization only
    const customers = await prisma.customer.findMany({
      where: {
        organizationId: user.organizationId,
        emailOptIn: true,
        status: 'ACTIVE',
      },
    })

    // Update campaign status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'SENDING',
        totalRecipients: customers.length,
      },
    })

    // Send emails in batches
    const batchSize = 50
    let sentCount = 0

    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize)

      const sendPromises = batch.map(async (customer) => {
        // Create email message record
        const message = await prisma.emailMessage.create({
          data: {
            campaignId: campaign.id,
            customerId: customer.id,
            to: customer.email!,
            subject: campaign.subject,
            htmlContent: campaign.htmlContent,
            textContent: campaign.textContent,
            status: 'PENDING',
          },
        })

        // Send email
        const result = await EmailService.send({
          to: customer.email!,
          subject: campaign.subject,
          html: campaign.htmlContent,
          text: campaign.textContent,
          from: `${campaign.fromName} <${campaign.fromEmail}>`,
          replyTo: campaign.replyTo,
        })

        // Update message status
        if (result.success) {
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          })
          sentCount++
        } else {
          await prisma.emailMessage.update({
            where: { id: message.id },
            data: {
              status: 'FAILED',
              errorMessage: result.error,
            },
          })
        }
      })

      await Promise.all(sendPromises)
    }

    // Update campaign final status
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        deliveredCount: sentCount,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        sent: sentCount,
        total: customers.length,
      },
    })
  } catch (error: any) {
    console.error('Send email campaign error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
