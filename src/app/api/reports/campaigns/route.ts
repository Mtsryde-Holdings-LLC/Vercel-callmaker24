import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    let orgId = session?.user?.organizationId

    // Fallback: lookup user by email if organizationId missing
    if (!orgId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { organizationId: true }
      })
      orgId = user?.organizationId
    }

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'ALL'

    // Fetch Email Campaign Reports
    const emailCampaigns = type === 'ALL' || type === 'EMAIL' 
      ? await prisma.emailCampaign.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            name: true,
            subject: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                messages: true
              }
            },
            messages: {
              select: {
                status: true,
                opened: true,
                clicked: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      : []

    // Fetch SMS Campaign Reports
    const smsCampaigns = type === 'ALL' || type === 'SMS'
      ? await prisma.smsCampaign.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                messages: true
              }
            },
            messages: {
              select: {
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      : []

    // Fetch IVR Campaign Reports (from calls)
    const ivrCampaigns = type === 'ALL' || type === 'IVR'
      ? await prisma.call.groupBy({
          by: ['campaignId'],
          where: {
            organizationId: orgId,
            campaignId: { not: null }
          },
          _count: {
            id: true
          }
        }).then(async (grouped) => {
          const campaignIds = grouped.map(g => g.campaignId).filter(Boolean) as string[]
          return await prisma.call.findMany({
            where: {
              organizationId: orgId,
              campaignId: { in: campaignIds }
            },
            select: {
              campaignId: true,
              status: true,
              duration: true,
              createdAt: true
            }
          })
        })
      : []

    // Fetch Social Media Campaign Reports
    const socialCampaigns = type === 'ALL' || type === 'SOCIAL'
      ? await prisma.socialPost.findMany({
          where: { organizationId: orgId },
          select: {
            id: true,
            content: true,
            status: true,
            platform: true,
            scheduledFor: true,
            createdAt: true,
            metadata: true
          },
          orderBy: { createdAt: 'desc' }
        })
      : []

    // Transform Email Reports
    const emailReports = emailCampaigns.map(campaign => {
      const sent = campaign._count.messages
      const delivered = campaign.messages.filter(m => m.status === 'DELIVERED' || m.status === 'OPENED').length
      const opened = campaign.messages.filter(m => m.opened).length
      const clicked = campaign.messages.filter(m => m.clicked).length
      const bounced = campaign.messages.filter(m => m.status === 'BOUNCED').length
      const failed = campaign.messages.filter(m => m.status === 'FAILED').length
      const unsubscribed = 0 // TODO: Track unsubscribes

      return {
        id: campaign.id,
        name: campaign.name,
        type: 'EMAIL',
        status: campaign.status,
        createdAt: campaign.createdAt,
        sent,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
        failed
      }
    })

    // Transform SMS Reports
    const smsReports = smsCampaigns.map(campaign => {
      const sent = campaign._count.messages
      const delivered = campaign.messages.filter(m => m.status === 'DELIVERED').length
      const failed = campaign.messages.filter(m => m.status === 'FAILED').length

      return {
        id: campaign.id,
        name: campaign.name,
        type: 'SMS',
        status: campaign.status,
        createdAt: campaign.createdAt,
        sent,
        delivered,
        opened: 0, // SMS doesn't track opens
        clicked: 0, // SMS click tracking would need link shortener
        bounced: failed,
        unsubscribed: 0,
        failed
      }
    })

    // Transform IVR Reports (Group by campaign)
    const ivrReportMap = new Map()
    ivrCampaigns.forEach(call => {
      if (!call.campaignId) return
      
      if (!ivrReportMap.has(call.campaignId)) {
        ivrReportMap.set(call.campaignId, {
          id: call.campaignId,
          name: `IVR Campaign ${call.campaignId.slice(0, 8)}`,
          type: 'IVR',
          status: 'COMPLETED',
          createdAt: call.createdAt,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0,
          failed: 0
        })
      }

      const report = ivrReportMap.get(call.campaignId)
      report.sent++
      
      if (call.status === 'COMPLETED') report.delivered++
      if (call.status === 'FAILED' || call.status === 'NO_ANSWER') report.failed++
      if (call.duration && call.duration > 10) report.opened++ // Consider answered if duration > 10s
    })

    const ivrReports = Array.from(ivrReportMap.values())

    // Transform Social Media Reports
    const socialReports = socialCampaigns.map(post => {
      const metadata = post.metadata as any || {}
      
      return {
        id: post.id,
        name: `${post.platform} Post`,
        type: 'SOCIAL',
        status: post.status,
        createdAt: post.createdAt,
        sent: 1,
        delivered: post.status === 'PUBLISHED' ? 1 : 0,
        opened: metadata.impressions || 0,
        clicked: metadata.clicks || 0,
        bounced: 0,
        unsubscribed: 0,
        failed: post.status === 'FAILED' ? 1 : 0
      }
    })

    // Combine all reports
    const allReports = [
      ...emailReports,
      ...smsReports,
      ...ivrReports,
      ...socialReports
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      reports: allReports
    })

  } catch (error) {
    console.error('Campaign reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
