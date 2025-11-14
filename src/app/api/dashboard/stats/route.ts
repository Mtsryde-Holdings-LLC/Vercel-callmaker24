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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch stats
    const [customers, emailCampaigns, smsCampaigns, socialAccounts] = await Promise.all([
      prisma.customer.count({ where: { userId: user.id } }),
      prisma.emailCampaign.count({ where: { userId: user.id } }),
      prisma.smsCampaign.count({ where: { userId: user.id } }),
      prisma.socialAccount.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({
      customers,
      emailCampaigns,
      smsCampaigns,
      socialAccounts,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
