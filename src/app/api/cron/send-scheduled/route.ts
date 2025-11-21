import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/services/email.service'
import { SmsService } from '@/services/sms.service'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    let emailsSent = 0
    let smsSent = 0

    // Send scheduled email campaigns
    const emailCampaigns = await prisma.emailCampaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } }
    })

    for (const campaign of emailCampaigns) {
      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING' }
      })

      const customers = await prisma.customer.findMany({
        where: { organizationId: campaign.organizationId },
        take: 100
      })

      for (const customer of customers) {
        if (customer.email) {
          try {
            await EmailService.send(
              customer.email,
              campaign.subject,
              campaign.htmlContent || '',
              campaign.createdById,
              campaign.organizationId,
              campaign.id
            )
            emailsSent++
          } catch (error) {
            console.error('Email send error:', error)
          }
        }
      }

      await prisma.emailCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', sentAt: new Date(), totalRecipients: emailsSent }
      })
    }

    // Send scheduled SMS campaigns
    const smsCampaigns = await prisma.smsCampaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } }
    })

    for (const campaign of smsCampaigns) {
      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING' }
      })

      const customers = await prisma.customer.findMany({
        where: { organizationId: campaign.organizationId },
        take: 100
      })

      for (const customer of customers) {
        if (customer.phone) {
          try {
            await SmsService.send(
              customer.phone,
              campaign.message,
              campaign.createdById,
              campaign.organizationId,
              campaign.id
            )
            smsSent++
          } catch (error) {
            console.error('SMS send error:', error)
          }
        }
      }

      await prisma.smsCampaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', sentAt: new Date(), totalRecipients: smsSent }
      })
    }

    return NextResponse.json({ emailsSent, smsSent })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
