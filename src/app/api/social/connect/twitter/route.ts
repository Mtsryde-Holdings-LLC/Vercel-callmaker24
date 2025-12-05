import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  const clientId = process.env.TWITTER_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/social/callback/twitter`
  const scope = 'tweet.read tweet.write users.read offline.access'

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scope)}&state=${session.user.id}&code_challenge=challenge&code_challenge_method=plain`

  return NextResponse.redirect(authUrl)
}
