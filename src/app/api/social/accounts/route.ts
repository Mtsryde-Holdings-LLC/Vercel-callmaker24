import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialMediaService } from '@/services/social-media.service'

// GET /api/social/accounts - Get all connected social accounts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.organizationId) {
      return NextResponse.json({ error: 'No organization assigned' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get('platform') as any

    const accounts = await SocialMediaService.getSocialAccounts(
      session.user.id,
      platform
    )

    return NextResponse.json({ accounts })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch social accounts' },
      { status: 500 }
    )
  }
}

// POST /api/social/accounts - Connect a new social account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      platform,
      platformUserId,
      username,
      displayName,
      profileImage,
      accessToken,
      refreshToken,
      tokenExpiresAt,
    } = body

    if (!platform || !platformUserId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields (platform, platformUserId, accessToken)' },
        { status: 400 }
      )
    }

    const account = await SocialMediaService.connectAccount({
      platform,
      platformUserId,
      username,
      displayName,
      profileImage,
      accessToken,
      refreshToken,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : undefined,
      userId: session.user.id,
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to connect social account' },
      { status: 500 }
    )
  }
}
