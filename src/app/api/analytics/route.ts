import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch analytics data (simplified for demo)
    const [emailCampaigns, smsCampaigns, socialPosts, customers] = await Promise.all([
      prisma.emailCampaign.findMany({
        where: {
          userId: user.id,
          sentAt: { gte: startDate },
        },
      }),
      prisma.smsCampaign.findMany({
        where: {
          userId: user.id,
          sentAt: { gte: startDate },
        },
      }),
      prisma.socialPost.findMany({
        where: {
          userId: user.id,
          publishedAt: { gte: startDate },
        },
      }),
      prisma.customer.count({
        where: {
          userId: user.id,
          createdAt: { gte: startDate },
        },
      }),
    ])

    // Calculate stats
    const emailStats = {
      totalSent: emailCampaigns.reduce((sum, c) => sum + c.totalRecipients, 0),
      openRate: emailCampaigns.length > 0
        ? emailCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) / emailCampaigns.length
        : 0,
      clickRate: emailCampaigns.length > 0
        ? emailCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) / emailCampaigns.length
        : 0,
      bounceRate: 2.3,
    }

    const smsStats = {
      totalSent: smsCampaigns.reduce((sum, c) => sum + c.totalRecipients, 0),
      deliveryRate: 98.5,
      responseRate: 15.2,
    }

    const socialStats = {
      totalPosts: socialPosts.length,
      totalEngagement: socialPosts.reduce((sum, p) => sum + (p.likes || 0) + (p.comments || 0) + (p.shares || 0), 0),
      avgEngagementRate: socialPosts.length > 0 ? 12.8 : 0,
    }

    const customerStats = {
      total: await prisma.customer.count({ where: { userId: user.id } }),
      new: customers,
      active: Math.floor(customers * 0.75),
      segments: await prisma.customer.findMany({
        where: { userId: user.id },
        select: { segment: true },
        distinct: ['segment'],
      }).then(results => results.filter(r => r.segment).length),
    }

    return NextResponse.json({
      emailStats,
      smsStats,
      socialStats,
      customerStats,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
