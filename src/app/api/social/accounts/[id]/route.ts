import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SocialMediaService } from '@/services/social-media.service'

// DELETE /api/social/accounts/[id] - Disconnect social account
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await SocialMediaService.disconnectAccount(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect account' },
      { status: 500 }
    )
  }
}

// POST /api/social/accounts/[id]/refresh - Refresh access token
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const account = await SocialMediaService.refreshAccessToken(params.id)

    return NextResponse.json({ account })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
