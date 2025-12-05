import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.FACEBOOK_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/instagram`
  const scope = 'instagram_basic,instagram_content_publish'

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${session.user.id}`

  return NextResponse.redirect(authUrl)
}
