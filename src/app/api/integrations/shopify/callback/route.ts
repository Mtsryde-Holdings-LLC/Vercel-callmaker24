import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');
    const hmac = searchParams.get('hmac');

    if (!code || !shop || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`);
    }

    const [organizationId] = state.split(':');

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const { access_token } = await tokenResponse.json();

    // Save integration to database
    await prisma.integration.upsert({
      where: {
        organizationId_platform: {
          organizationId,
          platform: 'SHOPIFY',
        },
      },
      create: {
        organizationId,
        platform: 'SHOPIFY',
        credentials: { shop, accessToken: access_token },
        isActive: true,
      },
      update: {
        credentials: { shop, accessToken: access_token },
        isActive: true,
      },
    });

    // Trigger initial sync
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/shopify/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, shop, accessToken: access_token }),
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?shopify=connected`);
  } catch (error: any) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=${error.message}`);
  }
}
