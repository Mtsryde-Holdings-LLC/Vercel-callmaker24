import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialMediaService } from '@/services/social-media.service'

// GET /api/social/analytics - Get social media analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!accountId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const analytics = await SocialMediaService.getAccountAnalytics(
      accountId,
      new Date(startDate),
      new Date(endDate)
    )

    return NextResponse.json({ analytics })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// POST /api/social/analytics/sync - Sync analytics from platforms
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { accountId } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId' },
        { status: 400 }
      )
    }

    const analytics = await SocialMediaService.syncAccountAnalytics(accountId)

    return NextResponse.json({ analytics })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync analytics' },
      { status: 500 }
    )
  }
}
