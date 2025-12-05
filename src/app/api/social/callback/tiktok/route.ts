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
    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/social/callback/tiktok`
      })
    })
    const { access_token, open_id } = await tokenRes.json()

    const userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    })
    const { data } = await userRes.json()

    await prisma.socialAccount.create({
      data: {
        platform: 'TIKTOK',
        platformUserId: open_id,
        username: data.display_name,
        displayName: data.display_name,
        accessToken: access_token,
        userId: state,
        organizationId: null,
        isActive: true
      }
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/social?connected=TikTok&username=${data.display_name}`)
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/social?error=connection_failed`)
  }
}
