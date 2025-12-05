import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/linkedin`
  const scope = 'w_member_social r_liteprofile'

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=${session.user.id}`

  return NextResponse.redirect(authUrl)
}
