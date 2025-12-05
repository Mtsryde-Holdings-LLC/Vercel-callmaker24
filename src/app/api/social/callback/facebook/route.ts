import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/social?error=missing_params`)
  }

  try {
    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&code=${code}&redirect_uri=${process.env.NEXTAUTH_URL}/api/social/callback/facebook`)
    const { access_token } = await tokenRes.json()

    const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${access_token}`)
    const userData = await userRes.json()

    await prisma.socialAccount.create({
      data: {
        platform: 'FACEBOOK',
        platformUserId: userData.id,
        username: userData.name,
        displayName: userData.name,
        accessToken: access_token,
        userId: state,
        organizationId: null,
        isActive: true
      }
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/social?connected=Facebook&username=${userData.name}`)
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/social?error=connection_failed`)
  }
}
