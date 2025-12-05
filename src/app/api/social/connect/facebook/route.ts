import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/facebook`
  const scope = 'pages_manage_posts,pages_read_engagement,pages_show_list'

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${session.user.id}`

  return NextResponse.redirect(authUrl)
}
